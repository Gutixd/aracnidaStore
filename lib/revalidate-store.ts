import { revalidatePath } from 'next/cache'
import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * La tienda se sirve desde caché (ISR) y se regenera SOLO cuando algo cambia
 * (stock, precio, producto, reseñas, preventas). Antes se regeneraba sola
 * cada 60 s (fichas) y 5 min (portada) aunque nada cambiara: cada visita o
 * bot después de ese plazo escribía la página de nuevo y se cobraba como
 * escritura ISR en Vercel.
 *
 * Marca como vencidas la portada y las fichas indicadas; se regeneran en la
 * próxima visita. Nunca lanza: si falla, la caché de 24 h es la red de
 * seguridad y la venta no se cae por esto.
 */
export function revalidateStorefront(slugs: (string | null | undefined)[] = []) {
  try {
    for (const slug of new Set(slugs.filter(Boolean))) revalidatePath(`/products/${slug}`)
    revalidatePath('/')
  } catch (e) {
    console.warn('[ISR] No se pudo revalidar la tienda:', e)
  }
}

/** Igual que revalidateStorefront, a partir de ids de producto. */
export async function revalidateProductsById(
  supabase: SupabaseClient,
  productIds: (string | null | undefined)[]
) {
  const ids = [...new Set(productIds.filter(Boolean))] as string[]
  if (ids.length === 0) return revalidateStorefront()
  try {
    const { data } = await supabase.from('products').select('slug').in('id', ids)
    revalidateStorefront((data ?? []).map((p) => p.slug as string))
  } catch (e) {
    console.warn('[ISR] No se pudo leer el slug para revalidar:', e)
    revalidateStorefront()
  }
}
