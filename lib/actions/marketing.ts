'use server'

import { createAdminClient } from '@/lib/supabase/server'
import { isAdmin } from '@/lib/auth/admin'

/**
 * Lista de correos para ofertas.
 *
 * Reglas que no hay que romper:
 * - Solo entra quien marcó la casilla en el checkout. La lista NO se rellena
 *   con clientes antiguos: nunca dieron permiso, y la Política de Privacidad
 *   promete no enviar publicidad sin consentimiento.
 * - Darse de baja no borra el contacto, lo marca. Así una compra posterior
 *   no lo revive por accidente.
 * - `getEnviables()` es la única fuente válida de destinatarios.
 */

/** Registra el consentimiento tras una compra. Llamar solo desde el servidor. */
export async function upsertMarketingContact(input: {
  email: string
  name?: string | null
  phone?: string | null
  consent: boolean
}) {
  const email = input.email.trim().toLowerCase()
  if (!email) return

  const supabase = await createAdminClient()

  const { data: existing } = await supabase
    .from('marketing_contacts')
    .select('email, consent, consent_at, unsubscribed_at')
    .eq('email', email)
    .maybeSingle()

  // Quien se dio de baja alguna vez no vuelve a la lista por comprar de nuevo.
  // Para volver tendría que pedirlo explícitamente.
  if (existing?.unsubscribed_at) return

  if (!existing && !input.consent) return // sin permiso no se crea el contacto

  await supabase.from('marketing_contacts').upsert(
    {
      email,
      name: input.name ?? null,
      phone: input.phone ?? null,
      // Un "no" posterior retira el permiso; un "sí" lo otorga.
      consent: input.consent,
      // Se guarda la fecha del primer sí, que es la que sirve como prueba
      // de cuándo se dio el permiso.
      consent_at: input.consent ? (existing?.consent_at ?? new Date().toISOString()) : null,
      source: 'checkout',
    },
    { onConflict: 'email' }
  )
}

export interface CustomerRow {
  email: string
  name: string
  phone: string
  pedidos: number
  total_gastado: number
  ultima_compra: string
  acepta_ofertas: boolean
}

/**
 * Ficha de cada cliente, construida desde los pedidos pagados. No se guarda
 * duplicada en otra tabla: los pedidos ya son la fuente de verdad y así no
 * hay dos versiones del mismo dato que se puedan desincronizar.
 */
export async function getCustomers(): Promise<CustomerRow[]> {
  if (!(await isAdmin())) return []

  const supabase = await createAdminClient()

  const { data: orders } = await supabase
    .from('orders')
    .select('customer_name, customer_email, customer_phone, total, created_at, payment_status')
    .eq('payment_status', 'pagado')
    .order('created_at', { ascending: false })

  const { data: contacts } = await supabase
    .from('marketing_contacts')
    .select('email, consent, unsubscribed_at')

  const enviables = new Set(
    (contacts ?? [])
      .filter((c) => c.consent && !c.unsubscribed_at)
      .map((c) => String(c.email).toLowerCase())
  )

  const porEmail = new Map<string, CustomerRow>()

  for (const o of orders ?? []) {
    const email = String(o.customer_email ?? '').trim().toLowerCase()
    if (!email) continue

    const fila = porEmail.get(email)
    if (fila) {
      fila.pedidos += 1
      fila.total_gastado += o.total ?? 0
      continue
    }

    // Los pedidos vienen del más nuevo al más viejo, así que el primero que
    // vemos de cada cliente trae su nombre y teléfono más recientes.
    porEmail.set(email, {
      email,
      name: o.customer_name ?? '',
      phone: o.customer_phone ?? '',
      pedidos: 1,
      total_gastado: o.total ?? 0,
      ultima_compra: o.created_at,
      acepta_ofertas: enviables.has(email),
    })
  }

  return [...porEmail.values()].sort((a, b) => b.total_gastado - a.total_gastado)
}

/** Los únicos correos a los que se puede enviar una oferta. */
export async function getEnviables(): Promise<{ email: string; name: string | null }[]> {
  if (!(await isAdmin())) return []

  const supabase = await createAdminClient()
  const { data } = await supabase
    .from('marketing_contacts')
    .select('email, name')
    .eq('consent', true)
    .is('unsubscribed_at', null)

  return data ?? []
}

/** Da de baja un correo. Se usará desde el enlace de las campañas. */
export async function unsubscribe(email: string) {
  const supabase = await createAdminClient()
  await supabase
    .from('marketing_contacts')
    .update({ consent: false, unsubscribed_at: new Date().toISOString() })
    .eq('email', email.trim().toLowerCase())
  return { ok: true }
}
