import crypto from 'crypto'
import { Order } from '@/types'
import { PICKUP_PLACE, PICKUP_SLOT_LABELS } from '@/lib/pickup'

/**
 * Crea la cita de retiro directo en Google Calendar, sin librerías externas:
 * Node trae `crypto`, que alcanza para firmar el JWT de una cuenta de
 * servicio (RS256) y pedir el token de acceso por REST.
 *
 * Solo aplica a pedidos con retiro presencial: son los únicos con día y hora
 * exactos reservados. Los envíos no tienen una hora que bloquear en el
 * calendario.
 *
 * Requiere en el entorno:
 *   GOOGLE_CALENDAR_CLIENT_EMAIL  — el "client_email" del JSON de la cuenta de servicio
 *   GOOGLE_CALENDAR_PRIVATE_KEY   — el "private_key" del mismo JSON (con los \n literales)
 *   GOOGLE_CALENDAR_ID            — el correo del calendario a usar (o "primary")
 */

const CLIENT_EMAIL = process.env.GOOGLE_CALENDAR_CLIENT_EMAIL
const PRIVATE_KEY = process.env.GOOGLE_CALENDAR_PRIVATE_KEY?.replace(/\\n/g, '\n')
const CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID

export const isCalendarEnabled = () => Boolean(CLIENT_EMAIL && PRIVATE_KEY && CALENDAR_ID)

function base64url(input: Buffer | string) {
  return Buffer.from(input)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

/** Intercambia la cuenta de servicio por un access token de corta duración. */
async function getAccessToken(): Promise<string> {
  const now = Math.floor(Date.now() / 1000)
  const header = { alg: 'RS256', typ: 'JWT' }
  const claims = {
    iss: CLIENT_EMAIL,
    scope: 'https://www.googleapis.com/auth/calendar.events',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  }

  const unsigned = `${base64url(JSON.stringify(header))}.${base64url(JSON.stringify(claims))}`
  const signature = crypto.sign('RSA-SHA256', Buffer.from(unsigned), PRIVATE_KEY!)
  const jwt = `${unsigned}.${base64url(signature)}`

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  })

  if (!res.ok) {
    throw new Error(`[Calendar] No se pudo obtener el access token: ${await res.text()}`)
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
