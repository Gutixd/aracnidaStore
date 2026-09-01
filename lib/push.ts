import webpush from 'web-push'
import { createAdminClient } from '@/lib/supabase/server'

/**
 * Notificaciones push del navegador para el panel de admin — el aviso que
 * llega al celular aunque el panel esté cerrado. Mismo patrón que
 * lib/telegram.ts y lib/email.ts: opcional, gated por env vars, y un fallo
 * acá nunca debe tumbar el flujo de compra del cliente.
 *
 * Estándar Web Push (VAPID), sin servicio de terceros ni SDK pesado — se
 * generan las claves una vez con `npx web-push generate-vapid-keys` y listo.
 */

const PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
const PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY
// mailto de contacto que exige el estándar VAPID, para que los proveedores
// push (Google, Mozilla) sepan a quién avisar si algo falla en gran escala.
const SUBJECT = process.env.VAPID_SUBJECT || 'mailto:contacto@aracnidastore.com'

export const isPushEnabled = () => Boolean(PUBLIC_KEY && PRIVATE_KEY)

if (isPushEnabled()) {
  webpush.setVapidDetails(SUBJECT, PUBLIC_KEY!, PRIVATE_KEY!)
}

/**
 * Avisa a todos los admins con notificaciones activadas. Se dispara en los
 * mismos dos puntos que ya notifican por Telegram, así que llega por ambos
 * canales a la vez sin duplicar lógica de "cuándo avisar".
 */
export async function sendPushToAdmins(title: string, body: string, url = '/admin/orders'): Promise<void> {
  if (!isPushEnabled()) return

  const supabase = await createAdminClient()
  const { data: subs } = await supabase.from('push_subscriptions').select('*')
  if (!subs?.length) return

  const payload = JSON.stringify({ title, body, url, tag: 'aracnida-order' })

  const results = await Promise.allSettled(
    subs.map((sub) =>
      webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        },
        payload
      )
    )
  )

  // Una suscripción "muerta" (410 Gone / 404) significa que el navegador la
  // invalidó — pasa si desinstalan la app, borran datos del sitio, etc. Sin
  // esto, cada pedido nuevo reintentaría para siempre contra un endpoint que
  // ya no existe.
  const deadIds: string[] = []
  results.forEach((result, i) => {
    if (result.status === 'rejected') {
      const statusCode = (result.reason as { statusCode?: number })?.statusCode
      if (statusCode === 404 || statusCode === 410) {
        deadIds.push(subs[i].id)
      } else {
        console.error('[Push] Error enviando:', result.reason)
      }
    }
  })

  if (deadIds.length) {
    await supabase.from('push_subscriptions').delete().in('id', deadIds)
  }
}
