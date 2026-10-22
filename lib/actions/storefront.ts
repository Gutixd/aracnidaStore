'use server'

import { createAdminClient } from '@/lib/supabase/server'
import { isAdmin } from '@/lib/auth/admin'
import { revalidateProductsById } from '@/lib/revalidate-store'

/**
 * Los formularios del admin guardan productos y stock directo en Supabase
 * desde el navegador; después de guardar llaman a esto para que la tienda
 * muestre el cambio (la caché ya no se regenera sola cada minuto).
 */
export async function refreshStorefront(productIds: string[] = []) {
  if (!(await isAdmin())) return { error: 'No autorizado' }
  const supabase = await createAdminClient()
  await revalidateProductsById(supabase, productIds)
  return { ok: true }
}
