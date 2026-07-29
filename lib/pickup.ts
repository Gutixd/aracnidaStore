// Configuración del retiro presencial en Metro Plaza de Maipú.
// Fuente de verdad única: la usan el checkout, el correo, Telegram y el panel.

export const PICKUP_PLACE = 'Metro Plaza de Maipú'
/** Horas mínimas de anticipación para coordinar un retiro. */
export const PICKUP_LEAD_HOURS = 24

export interface PickupSlot {
  id: 'martes' | 'sabado'
  label: string
  /** Plural en minúscula para frases tipo "los sábados de 11 a 15" */
  plural: string
  /** Día de la semana según Date.getDay(): 0=domingo … 6=sábado */
  weekday: number
  hours: string
  times: string[]
}

export const PICKUP_SLOTS: PickupSlot[] = [
  {
    id: 'martes',
    label: 'Martes',
    plural: 'martes',
    weekday: 2,
    hours: '13:00 – 16:00',
    times: ['13:00', '13:30', '14:00', '14:30', '15:00', '15:30'],
  },
  {
    id: 'sabado',
    label: 'Sábado',
    plural: 'sábados',
    weekday: 6,
    hours: '11:00 – 15:00',
    times: ['11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30'],
  },
]

export const PICKUP_SLOT_LABELS: Record<string, string> = Object.fromEntries(
  PICKUP_SLOTS.map((s) => [s.id, s.label])
)

/**
 * Devuelve la próxima fecha de ese día de la semana que respete las 24 horas
 * de anticipación. Si el próximo cae antes del margen, salta a la semana siguiente.
 */
export function getNextPickupDate(slot: PickupSlot, now: Date = new Date()): Date {
  const earliest = new Date(now.getTime() + PICKUP_LEAD_HOURS * 60 * 60 * 1000)

  const candidate = new Date(now)
  candidate.setHours(0, 0, 0, 0)

  // Avanza hasta encontrar un día que coincida y que supere el margen de 24 hrs.
  // El último horario del día define si todavía alcanza a servir.
  for (let i = 0; i <= 21; i++) {
    const d = new Date(candidate)
    d.setDate(candidate.getDate() + i)
    if (d.getDay() !== slot.weekday) continue

    const lastTime = slot.times[slot.times.length - 1]
    const [h, m] = lastTime.split(':').map(Number)
    const endOfSlot = new Date(d)
    endOfSlot.setHours(h, m, 0, 0)

    if (endOfSlot >= earliest) return d
  }

  return candidate
}

/**
 * Devuelve solo las horas de ese día que aún cumplen las 24 horas de margen.
 * Para fechas futuras devuelve todas.
 */
export function getAvailableTimes(slot: PickupSlot, date: Date, now: Date = new Date()): string[] {
  const earliest = new Date(now.getTime() + PICKUP_LEAD_HOURS * 60 * 60 * 1000)
  return slot.times.filter((t) => {
    const [h, m] = t.split(':').map(Number)
    const dt = new Date(date)
    dt.setHours(h, m, 0, 0)
    return dt >= earliest
  })
}

/** "Sábado 1 de agosto" — solo la primera letra en mayúscula */
export function formatPickupDate(date: Date | string): string {
  // Las fechas guardadas ("2026-08-01") se interpretarían como UTC y podrían
  // mostrar el día anterior en Chile, así que las parseamos como fecha local.
  const d =
    typeof date === 'string'
      ? /^\d{4}-\d{2}-\d{2}$/.test(date)
        ? new Date(`${date}T12:00:00`)
        : new Date(date)
      : date

  const s = d
    .toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' })
    .replace(',', '')
  return s.charAt(0).toUpperCase() + s.slice(1)
}

/** "2026-08-01" — se guarda así en la base de datos */
export function toISODate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}
