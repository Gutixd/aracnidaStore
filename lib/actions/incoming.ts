'use server'

import { createAdminClient } from '@/lib/supabase/server'
import { isAdmin } from '@/lib/auth/admin'
import { reservedByBatch } from '@/lib/incoming'
import { revalidatePath } from 'next/cache'

const ISO = /^\d{4}-\d{2}-\d{2}$/

function revalidateAll(slug?: string | null) {
  revalidatePath('/admin/incoming')
  revalidatePath('/admin/products')
  revalidatePath('/products')
  if (slug) revalidatePath(`/products/${slug}`)
}

/**
 * Registra una compra en camino: un producto, varias tallas con su cantidad,
 * el costo por unidad y el rango de fechas en que llega. Opcionalmente la
 * anota como gasto de inventario (así aparece en "Invertido" del mes).
 */
export async function createIncomingPurchase(input: {
  product_id: string
  unit_cost: number
  arrives_from: string
  arrives_to: string
  note?: string
  register_expense: boolean
  lines: { variant_id: string; quantity: number }[]
}) {
  if (!(await isAdmin())) return { error: 'No autorizado' }

  const lines = input.lines.filter((l) => Number(l.quantity) > 0)
  if (lines.length === 0) return { error: 'Indica cuántas unidades vienen en al menos una talla.' }
  if (lines.some((l) => !Number.isInteger(Number(l.quantity)) || Number(l.quantity) > 200)) {
    return { error: 'Las cantidades deben ser números enteros.' }
  }
  if (!ISO.test(input.arrives_from) || !ISO.test(input.arrives_to)) return { error: 'Elige las dos fechas de llegada.' }
  if (input.arrives_to < input.arrives_from) return { error: 'La fecha "hasta" no puede ser antes que "desde".' }
  const unitCost = Math.round(Number(input.unit_cost))
  if (!Number.isFinite(unitCost) || unitCost < 0) return { error: 'El costo por unidad no es válido.' }

  const supabase = await createAdminClient()
  const { data: product } = await supabase
    .from('products').select('id, name, slug').eq('id', input.product_id).single()
  if (!product) return { error: 'Producto no encontrado.' }

  const { data: variants } = await supabase
    .from('product_variants').select('id, size').eq('product_id', product.id)
  const sizeOf = new Map((variants ?? []).map((v) => [v.id as string, v.size as string]))
  if (lines.some((l) => !sizeOf.has(l.variant_id))) return { error: 'Una de las tallas no pertenece a este producto.' }

  const units = lines.reduce((s, l) => s + Number(l.quantity), 0)
  let expenseId: string | null = null
  if (input.register_expense && unitCost > 0) {
    const tallas = lines.map((l) => `${sizeOf.get(l.variant_id)}×${l.quantity}`).join(', ')
    const { data: exp, error: expErr } = await supabase
      .from('expenses')
      .insert({
        title: `Compra en camino: ${product.name} (${tallas})`,
        amount: unitCost * units,
        category: 'inventario',
        note: `${units} unidades a ${unitCost} c/u`,
      })
      .select('id')
      .single()
    if (expErr) return { error: 'No se pudo registrar el gasto.' }
    expenseId = exp.id
  }

  const { error } = await supabase.from('incoming_batches').insert(
    lines.map((l) => ({
      product_id: product.id,
      variant_id: l.variant_id,
      quantity: Number(l.quantity),
      unit_cost: unitCost,
      arrives_from: input.arrives_from,
      arrives_to: input.arrives_to,
      note: (input.note ?? '').trim().slice(0, 200),
      expense_id: expenseId,
    }))
  )
  if (error) {
    console.error('[En camino] Error creando lotes:', error)
    return { error: 'No se pudo guardar. Intenta de nuevo.' }
  }

  revalidateAll(product.slug)
  revalidatePath('/admin/expenses')
  return { ok: true, units }
}

/** Cambia el rango de llegada (el proveedor adelantó o atrasó el envío). */
export async function updateIncomingDates(batchId: string, from: string, to: string) {
  if (!(await isAdmin())) return { error: 'No autorizado' }
  if (!ISO.test(from) || !ISO.test(to) || to < from) return { error: 'Revisa las fechas.' }
  const supabase = await createAdminClient()
  const { data, error } = await supabase
    .from('incoming_batches')
    .update({ arrives_from: from, arrives_to: to })
    .eq('id', batchId)
    .eq('status', 'en_camino')
    .select('product:products(slug)')
    .single()
  if (error || !data) return { error: 'No se pudo actualizar.' }
  const p = data.product as { slug?: string } | { slug?: string }[] | null
  revalidateAll(Array.isArray(p) ? p[0]?.slug : p?.slug)
  return { ok: true }
}

/**
 * Llegaron los trajes. Lo reservado ya está vendido (va directo a esos
 * clientes); el resto se suma al stock de la talla. El costo de la talla se
 * promedia con el de esta compra, para que la ganancia de lo que se venda
 * después salga con el costo real.
 */
export async function receiveIncomingBatch(batchId: string) {
  if (!(await isAdmin())) return { error: 'No autorizado' }
  const supabase = await createAdminClient()

  // Condicional: dos clics seguidos no suman el stock dos veces.
  const { data: claimed } = await supabase
    .from('incoming_batches')
    .update({ status: 'recibido', received_at: new Date().toISOString() })
    .eq('id', batchId)
    .eq('status', 'en_camino')
    .select('id, product_id, variant_id, quantity, unit_cost')
    .single()
  if (!claimed) return { error: 'Este lote ya estaba marcado como recibido o cancelado.' }

  const reserved = (await reservedByBatch([batchId])).get(batchId) ?? 0
  const toStock = Math.max(0, claimed.quantity - reserved)

  const { data: variant } = await supabase
    .from('product_variants').select('stock, cost_price').eq('id', claimed.variant_id).single()
  if (variant && toStock > 0) {
    const oldStock = Number(variant.stock)
    const oldCost = Number(variant.cost_price ?? 0)
    const newStock = oldStock + toStock
    const newCost = oldStock > 0 && oldCost > 0
      ? Math.round((oldStock * oldCost + toStock * claimed.unit_cost) / newStock)
      : claimed.unit_cost
    await supabase
      .from('product_variants')
      .update({ stock: newStock, cost_price: newCost, updated_at: new Date().toISOString() })
      .eq('id', claimed.variant_id)
  }

  // El stock del producto es la suma de sus tallas.
  const { data: all } = await supabase
    .from('product_variants').select('stock').eq('product_id', claimed.product_id)
  const total = (all ?? []).reduce((s, v) => s + Number(v.stock), 0)
  const { data: product } = await supabase
    .from('products')
    .update({ stock: total, updated_at: new Date().toISOString() })
    .eq('id', claimed.product_id)
    .select('slug')
    .single()

  // Las preventas pagadas de este lote pasan a "Producto recibido".
  const { data: items } = await supabase
    .from('order_items').select('order_id').eq('incoming_batch_id', batchId)
  const orderIds = [...new Set((items ?? []).map((i) => i.order_id as string))]
  if (orderIds.length > 0) {
    await supabase
      .from('orders')
      .update({ status: 'producto_recibido', updated_at: new Date().toISOString() })
      .in('id', orderIds)
      .in('status', ['confirmado', 'en_preparacion'])
  }

  revalidateAll(product?.slug)
  revalidatePath('/admin/reservations')
  return { ok: true, toStock, reserved }
}

/** Cancela un lote que no va a llegar. Solo si nadie lo reservó. */
export async function cancelIncomingBatch(batchId: string) {
  if (!(await isAdmin())) return { error: 'No autorizado' }
  const reserved = (await reservedByBatch([batchId])).get(batchId) ?? 0
  if (reserved > 0) {
    return { error: `Tiene ${reserved} ${reserved === 1 ? 'reserva' : 'reservas'}. Cancélalas en Reservas antes de cancelar el lote.` }
  }
  const supabase = await createAdminClient()
  const { data } = await supabase
    .from('incoming_batches')
    .update({ status: 'cancelado' })
    .eq('id', batchId)
    .eq('status', 'en_camino')
    .select('product:products(slug)')
    .single()
  if (!data) return { error: 'No se pudo cancelar.' }
  const p = data.product as { slug?: string } | { slug?: string }[] | null
  revalidateAll(Array.isArray(p) ? p[0]?.slug : p?.slug)
  return { ok: true }
}
