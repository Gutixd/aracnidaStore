'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { isAdmin } from '@/lib/auth/admin'

interface PushSubscriptionInput {
  endpoint: string
  keys: { p256dh: string; auth: string }
}

/** Guarda la suscripción push del navegador actual, asociada al admin que la activó. */
export async function subscribeToPush(sub: PushSubscriptionInput, userAgent: string) {
  if (!(await isAdmin())) return { error: 'No autorizado' }

  const client = await createClient()
  const { data: { user } } = await client.auth.getUser()
  if (!user) return { error: 'No autorizado' }

  const supabase = await createAdminClient()
  const { error } = await supabase.from('push_subscriptions').upsert(
    {
      admin_user_id: user.id,
      endpoint: sub.endpoint,
      p256dh: sub.keys.p256dh,
      auth: sub.keys.auth,
      user_agent: userAgent,
    },
    { onConflict: 'endpoint' }
  )

  if (error) return { error: 'No se pudo activar la notificación' }
  return { ok: true }
}

/** Borra la suscripción de este navegador (al desactivar, o si el permiso se revoca). */
export async function unsubscribeFromPush(endpoint: string) {
  if (!(await isAdmin())) return { error: 'No autorizado' }

  const supabase = await createAdminClient()
  await supabase.from('push_subscriptions').delete().eq('endpoint', endpoint)
  return { ok: true }
}
