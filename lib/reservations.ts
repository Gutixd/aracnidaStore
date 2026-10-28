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

/**
 * Fecha de hoy en Chile (YYYY-MM-DD), sin importar la zona horaria del
 * servidor ni del navegador. Antes se usaba la hora local de cada lado: el
 * servidor (UTC) y el celular del cliente (Chile) podían estar en días
 * distintos de noche, y eso rompía la hidratación de la página de reserva
 * (error #418) y dejaba al servidor validando contra otro día.
 */
export function todayInChile(from = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Santiago', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(from)
}

/** Primera fecha válida para reservar (hoy en Chile + los días mínimos), en YYYY-MM-DD. */
export function minReservationDate(from = new Date()): string {
  const [y, m, day] = todayInChile(from).split('-').map(Number)
  const d = new Date(Date.UTC(y, m - 1, day + RESERVATION_MIN_DAYS))
  return d.toISOString().slice(0, 10)
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

/**
 * Cómo se entrega una reserva, en una línea. Un solo texto para el correo,
 * Telegram y el panel. Las reservas antiguas (antes de pedir la entrega al
 * reservar) quedaron con 'por_definir'.
 */
export function describeReservationDelivery(order: {
  delivery_method?: string | null
  delivery_address?: string | null
  delivery_commune?: string | null
  delivery_region?: string | null
}): string {
  if (order.delivery_method === 'delivery') {
    const parts = [order.delivery_address, order.delivery_commune, order.delivery_region].filter(Boolean)
    return `Envío a domicilio · ${parts.join(', ')}`
  }
  if (order.delivery_method === 'retiro') return 'Retiro en Metro Plaza de Maipú (se coordina el día al llegar)'
  return 'Por coordinar cuando llegue el producto'
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
