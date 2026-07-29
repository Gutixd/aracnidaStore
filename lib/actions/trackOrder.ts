'use server'

import { createAdminClient } from '@/lib/supabase/server'

/**
 * Busca un pedido por su código corto (los 8 caracteres que se muestran en el
 * correo y en Telegram) y el email del cliente, como verificación de que
 * quien pregunta es el dueño del pedido.
 * Devuelve el UUID completo para redirigir a /order-success/[id].
 */
export async function findOrderByCode(code: string, email: string) {
  const cleanCode = code.trim().toLowerCase().replace(/[^a-f0-9]/g, '')
  const cleanEmail = email.trim().toLowerCase()

  if (cleanCode.length < 6) return { error: 'Ingresa el código completo de tu pedido' }
  if (!cleanEmail.includes('@')) return { error: 'Ingresa un email válido' }

  const supabase = await createAdminClient()
  // Los emails no se guardan normalizados a minúscula, así que se usa `ilike`
  // (sin comodines = comparación exacta insensible a mayúsculas). El prefijo
  // del código se filtra acá porque PostgREST no castea `ilike` sobre uuid.
  const { data } = await supabase
    .from('orders')
    .select('id')
    .ilike('customer_email', cleanEmail)

  const match = (data ?? []).find((o) => o.id.replace(/-/g, '').startsWith(cleanCode))

  if (!match) {
    return { error: 'No encontramos un pedido con esos datos. Revisa el código y el email.' }
  }

  return { orderId: match.id as string }
}
