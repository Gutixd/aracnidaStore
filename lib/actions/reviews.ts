'use server'

import { createAdminClient, createClient } from '@/lib/supabase/server'
import { isAdmin } from '@/lib/auth/admin'
import { revalidatePath } from 'next/cache'
import { checkRateLimit } from '@/lib/rate-limit'

export interface ReviewSummary {
  average: number
  count: number
}

/**
 * Promedio y cantidad de reseñas APROBADAS de un producto.
 * Solo con datos reales: si no hay reseñas devuelve count 0 y no se
 * debe mostrar ninguna calificación.
 */
export async function getReviewSummary(productId: string): Promise<ReviewSummary> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('reviews')
    .select('rating')
    .eq('product_id', productId)
    .eq('approved', true)

  const ratings = (data ?? []).map((r) => r.rating)
  if (!ratings.length) return { average: 0, count: 0 }

  const average = ratings.reduce((s, r) => s + r, 0) / ratings.length
  return { average: Math.round(average * 10) / 10, count: ratings.length }
}

export async function getProductReviews(productId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('reviews')
    .select('id, customer_name, rating, comment, verified, created_at')
    .eq('product_id', productId)
    .eq('approved', true)
    .order('created_at', { ascending: false })
    .limit(50)
  return data ?? []
}

/**
 * Registra la reseña de un cliente. Queda pendiente de aprobación:
 * nada se publica sin que alguien lo revise.
 * Si el pedido existe y contiene el producto, se marca como compra verificada.
 */
export async function submitReview(input: {
  productId: string
  orderId?: string
  customerName: string
  rating: number
  comment: string
}) {
  const rl = await checkRateLimit('submit-review', { max: 5, windowMinutes: 60 })
  if (!rl.allowed) return { error: rl.error }

  const name = input.customerName.trim()
  const comment = input.comment.trim()

  if (name.length < 2) return { error: 'Escribe tu nombre' }
  if (!Number.isInteger(input.rating) || input.rating < 1 || input.rating > 5) {
    return { error: 'Selecciona una calificación de 1 a 5 estrellas' }
  }
  if (comment.length < 10) return { error: 'Cuéntanos un poco más (mínimo 10 caracteres)' }
  if (comment.length > 1000) return { error: 'El comentario es demasiado largo' }

  const supabase = await createAdminClient()

  // Verificar que el pedido exista y contenga realmente ese producto
  let verified = false
  let orderId: string | null = null

  if (input.orderId) {
    const { data: item } = await supabase
      .from('order_items')
      .select('id, order:orders(id, status)')
      .eq('order_id', input.orderId)
      .eq('product_id', input.productId)
      .maybeSingle()

    const order = item?.order as unknown as { status?: string } | null
    if (item && order && order.status !== 'cancelado') {
      verified = true
      orderId = input.orderId

      const { data: existing } = await supabase
        .from('reviews')
        .select('id')
        .eq('order_id', orderId)
        .eq('product_id', input.productId)
        .maybeSingle()
      if (existing) return { error: 'Ya dejaste una reseña para este producto' }
    }
  }

  const { error } = await supabase.from('reviews').insert({
    product_id: input.productId,
    order_id: orderId,
    customer_name: name.slice(0, 60),
    rating: input.rating,
    comment,
    verified,
    approved: false,
  })

  if (error) {
    console.error('[Reviews] Error guardando reseña:', error)
    return { error: 'No se pudo guardar tu reseña. Intenta nuevamente.' }
  }

  return { ok: true }
}

/** Aprueba o rechaza una reseña (solo administradores). */
export async function moderateReview(reviewId: string, approved: boolean) {
  if (!(await isAdmin())) return { error: 'No autorizado' }

  const supabase = await createAdminClient()
  const { error } = await supabase
    .from('reviews')
    .update({ approved })
    .eq('id', reviewId)

  if (error) return { error: 'No se pudo actualizar la reseña' }
  revalidatePath('/admin/reviews')
  return { ok: true }
}

export async function deleteReview(reviewId: string) {
  if (!(await isAdmin())) return { error: 'No autorizado' }

  const supabase = await createAdminClient()
  const { error } = await supabase.from('reviews').delete().eq('id', reviewId)
  if (error) return { error: 'No se pudo eliminar la reseña' }
  revalidatePath('/admin/reviews')
  return { ok: true }
}
