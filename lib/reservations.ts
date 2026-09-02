/**
 * Reglas de la reserva anticipada. Un solo lugar para los números, para que
 * la vitrina, el checkout, el servidor y el panel no puedan discrepar: el
 * precio se recalcula en el servidor desde la base de datos y nunca se
 * confía en lo que llegue del navegador.
 */

/** Días mínimos de anticipación entre hoy y la fecha en que lo necesita. */
export const RESERVATION_MIN_DAYS = 15

/** Descuento por reservar con anticipación. */
export const RESERVATION_DISCOUNT_RATE = 0.15

export interface ReservationBreakdown {
  /** Precio de lista, sin descuento */
  normal: number
  /** Monto descontado (15%) */
  discount: number
  /** Precio final con el descuento aplicado — se paga 100% al reservar. */
  final: number
}

/** Todos los montos en pesos enteros. */
export function calcReservation(unitPrice: number, quantity: number): ReservationBreakdown {
  const normal = Math.round(unitPrice * quantity)
  const discount = Math.round(normal * RESERVATION_DISCOUNT_RATE)
  const final = normal - discount
  return { normal, discount, final }
}

/** Primera fecha válida para reservar (hoy + los días mínimos), en YYYY-MM-DD. */
export function minReservationDate(from = new Date()): string {
  const d = new Date(from)
  d.setDate(d.getDate() + RESERVATION_MIN_DAYS)
  return toISODate(d)
}

/**
 * Valida la anticipación comparando solo fechas (sin horas): si alguien
 * reserva a las 23:59, el día sigue contando completo.
 */
export function hasEnoughNotice(neededBy: string, from = new Date()): boolean {
  const target = parseISODate(neededBy)
  if (!target) return false
  const min = parseISODate(minReservationDate(from))!
  return target.getTime() >= min.getTime()
}

export function toISODate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** Construye la fecha en horario local para no correrse un día por zona horaria. */
export function parseISODate(value: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!m) return null
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
  return Number.isNaN(d.getTime()) ? null : d
}

export function formatReservationDate(value: string): string {
  const d = parseISODate(value)
  if (!d) return value
  return d.toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

/** Etiquetas del estado de la reserva (las de un pedido normal no calzan). */
export const RESERVATION_STATUS_LABELS: Record<string, string> = {
  pendiente: 'Pendiente de pago',
  confirmado: 'Confirmada',
  en_preparacion: 'Producto en preparación',
  producto_recibido: 'Producto recibido',
  lista_entrega: 'Lista para entrega',
  entregado: 'Entregada',
  cancelado: 'Cancelada',
}

export const RESERVATION_STATUS_COLORS: Record<string, string> = {
  pendiente: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  confirmado: 'bg-blue-50 text-blue-700 border-blue-200',
  en_preparacion: 'bg-purple-50 text-purple-700 border-purple-200',
  producto_recibido: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  lista_entrega: 'bg-teal-50 text-teal-700 border-teal-200',
  entregado: 'bg-green-50 text-green-700 border-green-200',
  cancelado: 'bg-red-50 text-red-700 border-red-200',
}

/** Orden en que avanza una reserva, para el selector del panel. */
export const RESERVATION_STATUS_FLOW = [
  'pendiente',
  'confirmado',
  'en_preparacion',
  'producto_recibido',
  'lista_entrega',
  'entregado',
  'cancelado',
] as const
