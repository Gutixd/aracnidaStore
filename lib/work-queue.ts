import type { Order } from '@/types'

/**
 * Cola de trabajo del panel: a qué grupo pertenece cada pedido o reserva y
 * cuál es el siguiente paso. Un solo lugar para las reglas, para que la
 * pantalla "Hoy" no decida una cosa y los botones otra.
 */

export type QueueGroup = 'cobrar' | 'preparar' | 'retiros' | 'camino' | 'esperando'

export type QueueAction =
  | { kind: 'confirm-reservation-payment'; label: string }
  | { kind: 'mark-paid'; label: string }
  | { kind: 'order-status'; label: string; to: 'en_preparacion' | 'en_reparto' | 'entregado' }
  | { kind: 'reservation-status'; label: string; to: 'entregado' }
  | { kind: 'none'; label: string }

export interface QueueItem {
  order: Order
  group: QueueGroup
  action: QueueAction
  /** Aviso corto en rojo/ámbar ("Lleva 2 días sin pagar") */
  alert: string | null
  /** Cuánto lleva esperando, en horas */
  ageHours: number
}

export const GROUP_META: Record<QueueGroup, { title: string; hint: string; color: string; bg: string }> = {
  cobrar: {
    title: 'Cobrar y confirmar pago',
    hint: 'Pedidos sin pagar o transferencias por confirmar',
    color: '#b45309', bg: 'rgba(245,158,11,.10)',
  },
  preparar: {
    title: 'Preparar y despachar',
    hint: 'Pagados y listos para armar el paquete. El más antiguo primero.',
    color: '#c0392b', bg: 'rgba(192,57,43,.08)',
  },
  retiros: {
    title: 'Retiros en Plaza de Maipú',
    hint: 'Se entregan en persona, ordenados por día y hora',
    color: '#15803d', bg: 'rgba(22,163,74,.09)',
  },
  camino: {
    title: 'En camino al cliente',
    hint: 'Despachados que esperan llegar',
    color: '#1d4ed8', bg: 'rgba(37,99,235,.08)',
  },
  esperando: {
    title: 'Esperando que llegue el traje',
    hint: 'Preventas y reservas pagadas: aún no hay nada que hacer',
    color: '#6b7280', bg: 'rgba(107,114,128,.09)',
  },
}

export const GROUP_ORDER: QueueGroup[] = ['cobrar', 'preparar', 'retiros', 'camino', 'esperando']

export function isPreorder(o: Pick<Order, 'notes'>): boolean {
  return (o.notes ?? '').startsWith('Preventa')
}

export function ageLabel(hours: number): string {
  if (hours < 1) return 'hace minutos'
  if (hours < 24) return `hace ${Math.floor(hours)} h`
  const d = Math.floor(hours / 24)
  return `hace ${d} ${d === 1 ? 'día' : 'días'}`
}

/**
 * Devuelve null si el pedido no requiere nada (entregado o cancelado).
 * `waitingForStock`: ids de pedidos cuyo traje viene en un lote aún en camino.
 */
export function classify(o: Order, now: number, waitingForStock: Set<string> = new Set()): QueueItem | null {
  if (o.status === 'cancelado' || o.status === 'entregado') return null

  const ageHours = Math.max(0, (now - new Date(o.created_at).getTime()) / 3600_000)
  const retiro = o.delivery_method === 'retiro'
  const item = (group: QueueGroup, action: QueueAction, alert: string | null = null): QueueItem =>
    ({ order: o, group, action, alert, ageHours })

  // ── Pago ──
  // Un retiro normal se paga en persona (efectivo o transferencia al retirar):
  // no es "cobrar" ahora, va directo a la lista de retiros.
  const pagoPendiente = o.payment_status === 'pendiente' && !(retiro && !o.is_reservation)
  if (pagoPendiente || o.payment_status === 'rechazado') {
    if (o.payment_status === 'rechazado') {
      return item('cobrar', { kind: 'mark-paid', label: 'Marcar como pagado' }, 'Pago rechazado: revisa con el cliente')
    }
    const alerta = ageHours >= 48 ? `Lleva ${Math.floor(ageHours / 24)} días sin pagar`
      : ageHours >= 24 ? 'Lleva más de un día sin pagar' : null
    if (o.is_reservation && o.payment_method === 'transferencia') {
      return item('cobrar', { kind: 'confirm-reservation-payment', label: 'Confirmar pago recibido' }, alerta)
    }
    if (o.payment_method === 'mercadopago') {
      return item('cobrar', { kind: 'none', label: 'Esperando a Mercado Pago' }, alerta)
    }
    return item('cobrar', { kind: 'mark-paid', label: 'Marcar como pagado' }, alerta)
  }

  // ── Reservas y preventas ──
  if (o.is_reservation) {
    // Preventa pagada cuyo lote todavía no llega: no hay nada que armar aún
    // (aunque el pago la haya dejado como "lista para entrega").
    if (waitingForStock.has(o.id)) return item('esperando', { kind: 'none', label: 'Sin acción' })
    if (o.status === 'producto_recibido' || o.status === 'lista_entrega') {
      return retiro
        ? item('retiros', { kind: 'reservation-status', label: 'Marcar entregado', to: 'entregado' })
        : item('preparar', { kind: 'reservation-status', label: 'Marcar despachado', to: 'entregado' })
    }
    return item('esperando', { kind: 'none', label: 'Sin acción' })
  }

  // ── Pedidos normales ──
  if (o.status === 'en_reparto') {
    return item('camino', { kind: 'order-status', label: 'Marcar entregado', to: 'entregado' })
  }
  if (retiro) {
    return item('retiros', { kind: 'order-status', label: 'Marcar entregado', to: 'entregado' })
  }
  if (o.status === 'en_preparacion') {
    return item('preparar', { kind: 'order-status', label: 'Marcar despachado', to: 'en_reparto' },
      ageHours >= 72 ? 'Lleva más de 3 días esperando' : null)
  }
  return item('preparar', { kind: 'order-status', label: 'Empezar a preparar', to: 'en_preparacion' },
    ageHours >= 72 ? 'Lleva más de 3 días esperando' : null)
}

/** Orden dentro de cada grupo: lo más antiguo (o lo que se entrega antes) primero. */
export function sortGroup(group: QueueGroup, items: QueueItem[]): QueueItem[] {
  const arr = [...items]
  if (group === 'retiros') {
    return arr.sort((a, b) =>
      (a.order.pickup_date ?? '9999').localeCompare(b.order.pickup_date ?? '9999') ||
      (a.order.pickup_time ?? '99:99').localeCompare(b.order.pickup_time ?? '99:99') ||
      b.ageHours - a.ageHours)
  }
  return arr.sort((a, b) => b.ageHours - a.ageHours)
}
