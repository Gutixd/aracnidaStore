import { createHmac, timingSafeEqual } from 'crypto'

/**
 * Mensajes directos de Instagram (Instagram API con inicio de sesión de
 * Instagram, igual que la publicación en lib/instagram.ts).
 *
 * Requiere en el entorno:
 *   INSTAGRAM_ACCESS_TOKEN          — token de la cuenta (IGAA...) con el permiso
 *                                     instagram_business_manage_messages
 *   INSTAGRAM_APP_SECRET            — "Clave secreta de la app de Instagram" (firma del webhook)
 *   INSTAGRAM_WEBHOOK_VERIFY_TOKEN  — texto cualquiera, el mismo que se pone en Meta
 */

const ACCESS_TOKEN = process.env.INSTAGRAM_ACCESS_TOKEN
const APP_SECRET = process.env.INSTAGRAM_APP_SECRET
const API = 'https://graph.instagram.com/v21.0'

/** Instagram corta los mensajes de texto en 1000 caracteres. */
export const IG_MAX_TEXT = 1000

export const dmConfigStatus = () => ({
  accessToken: Boolean(ACCESS_TOKEN),
  appSecret: Boolean(APP_SECRET),
  verifyToken: Boolean(process.env.INSTAGRAM_WEBHOOK_VERIFY_TOKEN),
})

/**
 * Meta firma cada aviso con HMAC-SHA256 del cuerpo crudo usando el secreto
 * de la app. Sin esto, cualquiera podría mandar mensajes falsos al webhook y
 * hacer que la IA le responda a quien quiera.
 */
export function isValidSignature(rawBody: string, header: string | null): boolean {
  if (!APP_SECRET || !header?.startsWith('sha256=')) return false
  const expected = createHmac('sha256', APP_SECRET).update(rawBody, 'utf8').digest('hex')
  const got = header.slice('sha256='.length)
  if (got.length !== expected.length) return false
  return timingSafeEqual(Buffer.from(got, 'hex'), Buffer.from(expected, 'hex'))
}

/** Envía un mensaje de texto. Devuelve el id del mensaje en Instagram. */
export async function sendInstagramText(recipientId: string, text: string): Promise<string | null> {
  if (!ACCESS_TOKEN) throw new Error('Falta INSTAGRAM_ACCESS_TOKEN')
  const res = await fetch(`${API}/me/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ACCESS_TOKEN}` },
    body: JSON.stringify({
      recipient: { id: recipientId },
      message: { text: text.slice(0, IG_MAX_TEXT) },
    }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(`Instagram rechazó el mensaje: ${JSON.stringify(data.error ?? data)}`)
  return (data.message_id as string) ?? null
}

/** Nombre de usuario del cliente (si la API lo entrega; es opcional). */
export async function fetchInstagramUsername(igsid: string): Promise<string | null> {
  if (!ACCESS_TOKEN) return null
  try {
    const res = await fetch(`${API}/${igsid}?fields=username`, {
      headers: { Authorization: `Bearer ${ACCESS_TOKEN}` },
    })
    if (!res.ok) return null
    const data = await res.json()
    return (data.username as string) ?? null
  } catch {
    return null
  }
}

/** Forma del aviso que manda Meta (solo lo que se usa). */
export interface IgWebhookBody {
  object?: string
  entry?: {
    id: string
    time: number
    messaging?: {
      sender: { id: string }
      recipient: { id: string }
      timestamp: number
      message?: {
        mid: string
        text?: string
        is_echo?: boolean
        is_deleted?: boolean
        attachments?: { type: string }[]
      }
    }[]
  }[]
}
