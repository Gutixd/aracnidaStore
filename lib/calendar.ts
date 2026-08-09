import { Order } from '@/types'
import { PICKUP_PLACE, PICKUP_SLOT_LABELS } from '@/lib/pickup'

/**
 * Crea la cita de retiro directo en Google Calendar.
 *
 * Usa OAuth con la cuenta personal del dueño (no una cuenta de servicio):
 * Google Workspace bloquea la creación de claves de cuenta de servicio por
 * política de organización (`iam.disableServiceAccountKeyCreation`), y no
 * tiene sentido pedir a un admin que la desactive por un solo calendario.
 * El flujo OAuth con refresh token no depende de esa política, y además el
 * evento cae directo en el calendario del dueño sin tener que compartirlo
 * con nadie.
 *
 * Solo aplica a pedidos con retiro presencial: son los únicos con día y hora
 * exactos reservados. Los envíos no tienen una hora que bloquear en el
 * calendario.
 *
 * Requiere en el entorno (ver README de configuración para obtenerlas):
 *   GOOGLE_CALENDAR_CLIENT_ID
 *   GOOGLE_CALENDAR_CLIENT_SECRET
 *   GOOGLE_CALENDAR_REFRESH_TOKEN
 *   GOOGLE_CALENDAR_ID            — "primary" para el calendario principal del dueño
 */

const CLIENT_ID = process.env.GOOGLE_CALENDAR_CLIENT_ID
const CLIENT_SECRET = process.env.GOOGLE_CALENDAR_CLIENT_SECRET
const REFRESH_TOKEN = process.env.GOOGLE_CALENDAR_REFRESH_TOKEN
const CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID || 'primary'

export const isCalendarEnabled = () => Boolean(CLIENT_ID && CLIENT_SECRET && REFRESH_TOKEN)

/** Cambia el refresh token (de larga duración) por un access token de una hora. */
async function getAccessToken(): Promise<string> {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: CLIENT_ID!,
      client_secret: CLIENT_SECRET!,
      refresh_token: REFRESH_TOKEN!,
      grant_type: 'refresh_token',
    }),
  })

  if (!res.ok) {
    throw new Error(`[Calendar] No se pudo renovar el access token: ${await res.text()}`)
  }
  const data = await res.json()
  return data.access_token as string
}

function money(n: number) {
  return `$${Number(n).toLocaleString('es-CL')}`
}

/**
 * Crea el evento de la cita de retiro y devuelve su id de Google Calendar
 * (para poder borrarlo después si el pedido se cancela). Duración: 30
 * minutos, que es el ancho de cada bloque horario del checkout.
 */
export async function createPickupEvent(order: Order): Promise<string | null> {
  if (!isCalendarEnabled()) return null
  if (order.delivery_method !== 'retiro' || !order.pickup_date || !order.pickup_time) return null

  try {
    const token = await getAccessToken()

    const [hh, mm] = order.pickup_time.split(':').map(Number)
    const start = new Date(`${order.pickup_date}T00:00:00`)
    start.setHours(hh, mm, 0, 0)
    const end = new Date(start.getTime() + 30 * 60 * 1000)

    const toLocal = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}T${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:00`

    const itemLines =
      order.items
        ?.map((i) => `• ${i.product_name} (talla ${i.size}) ×${i.quantity} — ${money(i.total_price)}`)
        .join('\n') ?? ''

    const slotLabel = order.pickup_slot ? PICKUP_SLOT_LABELS[order.pickup_slot] ?? '' : ''

    const event = {
      summary: `🕷️ Retiro — ${order.customer_name}`,
      location: PICKUP_PLACE,
      description: [
        `Pedido #${order.id.slice(0, 8).toUpperCase()} · ${slotLabel}`,
        '',
        itemLines,
        '',
        `Total: ${money(order.total)}`,
        `Pago: ${order.payment_method ?? 'por confirmar'} (${order.payment_status})`,
        '',
        `Cliente: ${order.customer_name}`,
        `Teléfono: ${order.customer_phone}`,
        `Correo: ${order.customer_email}`,
        order.notes ? `\nNotas: ${order.notes}` : '',
      ]
        .filter(Boolean)
        .join('\n'),
      start: { dateTime: toLocal(start), timeZone: 'America/Santiago' },
      end: { dateTime: toLocal(end), timeZone: 'America/Santiago' },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'popup', minutes: 60 },
          { method: 'email', minutes: 24 * 60 },
        ],
      },
    }

    const res = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(CALENDAR_ID!)}/events`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(event),
      }
    )

    if (!res.ok) {
      console.error('[Calendar] Error creando evento:', await res.text())
      return null
    }

    const created = await res.json()
    return created.id as string
  } catch (err) {
    console.error('[Calendar] Excepción creando evento:', err)
    return null
  }
}

/** Borra el evento de retiro cuando el pedido se cancela. */
export async function deletePickupEvent(eventId: string): Promise<void> {
  if (!isCalendarEnabled()) return
  try {
    const token = await getAccessToken()
    await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(CALENDAR_ID!)}/events/${eventId}`,
      { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }
    )
  } catch (err) {
    // No es crítico: el pedido ya quedó cancelado en la base igual.
    console.error('[Calendar] No se pudo borrar el evento:', err)
  }
}
