'use server'

import { createAdminClient } from '@/lib/supabase/server'
import { isAdmin } from '@/lib/auth/admin'
import { upsertMarketingContact } from '@/lib/actions/marketing'
import { checkRateLimit } from '@/lib/rate-limit'
import { reservationSchema, type ReservationFormData } from '@/lib/validations'
import { calcReservation, hasEnoughNotice, RESERVATION_MIN_DAYS, type ReservationBreakdown } from '@/lib/reservations'
import { reservedByBatch } from '@/lib/incoming'
import { formatArrival } from '@/lib/incoming-format'
import { calcShippingCost } from '@/lib/shipping'
import { notifyNewReservation } from '@/lib/telegram'
import { sendPushToAdmins } from '@/lib/push'
import { sendReservationReceipt, sendAdminReservationNotification } from '@/lib/email'
import { notifyOrderStarted } from '@/lib/alerts'
import type { Order } from '@/types'
import { revalidatePath } from 'next/cache'
import { revalidateProductsById } from '@/lib/revalidate-store'

/**
 * Crea una reserva anticipada. A diferencia de un pedido normal:
 *
 * - NO descuenta stock. Una reserva es un encargo de algo que todavía no
 *   tenemos ("el producto será gestionado y recibido por nosotros antes de
 *   coordinar la entrega"); descontar inventario que no existe descuadraría
 *   el stock real y bloquearía ventas inmediatas de lo que sí hay.
 * - Pide cómo se entrega (retiro o envío) y cobra el envío junto con la
 *   reserva. Antes quedaba 'por_definir' y el envío había que cobrarlo
 *   aparte cuando llegaba el producto.
 * - El precio se recalcula acá desde la base de datos. Nunca se confía en el
 *   monto que venga del navegador.
 */
export async function createReservation(input: ReservationFormData) {
  const parsed = reservationSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }
  }
  const data = parsed.data

  const rl = await checkRateLimit('create-reservation', { max: 5, windowMinutes: 30 })
  if (!rl.allowed) return { error: rl.error }

  const supabase = await createAdminClient()

  // Preventa de un lote en camino: llega en fechas conocidas, así que no
  // aplica la anticipación mínima ni el 15% (se paga el precio normal).
  let batch: { id: string; variant_id: string; quantity: number; unit_cost: number; arrives_from: string; arrives_to: string } | null = null
  if (data.incoming_batch_id) {
    const { data: b } = await supabase
      .from('incoming_batches')
      .select('id, variant_id, quantity, unit_cost, arrives_from, arrives_to, status')
      .eq('id', data.incoming_batch_id)
      .single()
    if (!b || b.status !== 'en_camino' || b.variant_id !== data.variant_id) {
      return { error: 'Esa talla ya no está disponible en preventa. Actualiza la página.' }
    }
    const libres = b.quantity - ((await reservedByBatch([b.id])).get(b.id) ?? 0)
    if (libres < data.quantity) {
      return { error: libres > 0 ? `Solo quedan ${libres} en preventa para esa talla.` : 'Se acaban de reservar todas las unidades en camino de esa talla.' }
    }
    batch = b
  } else if (!hasEnoughNotice(data.needed_by)) {
    // La anticipación se valida en el servidor aunque el formulario ya la
    // valide: el cliente puede mandar cualquier fecha.
    return { error: `La reserva necesita al menos ${RESERVATION_MIN_DAYS} días de anticipación.` }
  }

  const { data: variant } = await supabase
    .from('product_variants')
    .select('id, size, price, cost_price, active, product_id')
    .eq('id', data.variant_id)
    .single()

  if (!variant || variant.active === false) {
    return { error: 'Ese producto no está disponible para reservar.' }
  }

  const { data: product } = await supabase
    .from('products')
    .select('id, name, color, image_url, active, cost_price, category:categories(slug)')
    .eq('id', variant.product_id)
    .single()

  if (!product || product.active === false) {
    return { error: 'Ese producto no está disponible para reservar.' }
  }
  // "Otros" son unidades sueltas, sin reposición asegurada: no se reservan.
  const categoria = product.category as { slug?: string } | { slug?: string }[] | null
  const slugCategoria = Array.isArray(categoria) ? categoria[0]?.slug : categoria?.slug
  if (slugCategoria === 'otros') {
    return { error: 'Este producto no se puede reservar. Puedes comprarlo directamente si hay stock.' }
  }

  const amounts: ReservationBreakdown = batch
    ? (() => { const normal = Math.round(Number(variant.price) * data.quantity); return { normal, discount: 0, final: normal } })()
    : calcReservation(Number(variant.price), data.quantity)
  const neededBy = batch ? batch.arrives_to : data.needed_by
  const notes = batch
    ? `Preventa · llega ${formatArrival(batch.arrives_from, batch.arrives_to)}${data.notes ? ` · ${data.notes}` : ''}`
    : data.notes ?? ''

  // El envío se calcula acá con la misma tabla de zonas que el checkout
  // normal, nunca con un monto enviado desde el navegador. El 15% de
  // descuento aplica solo al producto; el envío se cobra completo.
  const isDelivery = data.delivery_method === 'delivery'
  const shippingCost = calcShippingCost(data.delivery_method, data.delivery_region, amounts.final)
  const total = amounts.final + shippingCost

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      is_reservation: true,
      customer_name: data.customer_name,
      customer_email: data.customer_email,
      customer_phone: data.customer_phone,
      subtotal: amounts.normal,
      discount: amounts.discount,
      shipping_cost: shippingCost,
      total,
      // Se paga 100% al reservar (producto + envío): no queda saldo pendiente.
      deposit_amount: total,
      balance_due: 0,
      needed_by: neededBy,
      delivery_method: data.delivery_method,
      delivery_address: isDelivery ? data.delivery_address ?? '' : '',
      delivery_region: isDelivery ? data.delivery_region ?? null : null,
      delivery_commune: isDelivery ? data.delivery_commune ?? '' : '',
      delivery_reference: isDelivery ? data.delivery_reference ?? '' : '',
      payment_method: data.payment_method,
      status: 'pendiente',
      payment_status: 'pendiente',
      notes,
      marketing_opt_in: data.marketing_opt_in === true,
    })
    .select()
    .single()

  if (orderError || !order) {
    console.error('[Reserva] Error creando la reserva:', orderError)
    return { error: 'No se pudo crear la reserva. Intenta nuevamente.' }
  }

  const { error: itemError } = await supabase.from('order_items').insert({
    order_id: order.id,
    product_id: product.id,
    variant_id: variant.id,
    product_name: product.name,
    product_image: product.image_url,
    size: variant.size,
    color: product.color,
    quantity: data.quantity,
    // Se guarda el precio YA con descuento, para que el detalle del pedido
    // cuadre con el total cobrado y con lo que ve el cliente.
    unit_price: Math.round(amounts.final / data.quantity),
    // Costo congelado al reservar, para calcular la ganancia real del mes.
    unit_cost: batch && batch.unit_cost > 0
      ? batch.unit_cost
      : Number(variant.cost_price) > 0 ? Number(variant.cost_price) : Number(product.cost_price ?? 0),
    total_price: amounts.final,
    incoming_batch_id: batch?.id ?? null,
  })

  if (itemError) {
    console.error('[Reserva] Error guardando el detalle:', itemError)
  }

  // Dos personas pueden haber reservado la última unidad al mismo tiempo:
  // si al guardar ya se pasó del total, se anula esta reserva (aún sin pagar).
  if (batch) {
    const ocupados = (await reservedByBatch([batch.id])).get(batch.id) ?? 0
    if (itemError || ocupados > batch.quantity) {
      await supabase.from('orders').update({ status: 'cancelado' }).eq('id', order.id)
      return { error: 'Se acaban de reservar las últimas unidades en camino de esa talla.' }
    }
  }

  if (data.marketing_opt_in === true) {
    await upsertMarketingContact({
      email: data.customer_email,
      name: data.customer_name,
      phone: data.customer_phone,
      consent: true,
    })
  }

  // Una preventa ocupa un cupo del lote en camino: la ficha debe mostrarlo
  if (batch) await revalidateProductsById(supabase, [product.id])

  // Aviso inmediato: el de "reserva pagada" solo sale al confirmarse el pago,
  // y una reserva por transferencia puede quedar días sin que nadie la vea.
  await notifyOrderStarted({
    ...order,
    items: [{ product_name: product.name, size: variant.size, quantity: data.quantity }],
  } as unknown as Order)

  return { reservationId: order.id as string, amounts }
}

/**
 * Avisos de reserva nueva. Se llama recién cuando el pago está confirmado
 * (no al crearla), para no avisar de reservas que nunca se pagaron.
 */
export async function notifyReservationPaid(reservationId: string) {
  const supabase = await createAdminClient()
  const { data: reservation } = await supabase
    .from('orders')
    .select('*, items:order_items(*)')
    .eq('id', reservationId)
    .single()

  if (!reservation) return

  await notifyNewReservation(reservation)
  await sendReservationReceipt(reservation)
  await sendAdminReservationNotification(reservation)
  await sendPushToAdmins(
    '💰 Reserva pagada',
    `${reservation.customer_name} — $${Number(reservation.total).toLocaleString('es-CL')}`,
    '/admin/reservations'
  )
}

/**
 * Confirma manualmente el pago de una reserva pagada por transferencia.
 * En transferencia no hay webhook que avise, así que el dueño la marca al
 * ver la plata acreditada — y recién ahí salen los avisos y el comprobante,
 * igual que en el flujo de Mercado Pago.
 */
export async function confirmReservationPayment(reservationId: string) {
  if (!(await isAdmin())) return { error: 'No autorizado' }

  const supabase = await createAdminClient()

  // Condicional para que dos clics seguidos no manden el comprobante dos veces.
  const { data: claimed } = await supabase
    .from('orders')
    .update({
      payment_status: 'pagado',
      status: 'confirmado',
      updated_at: new Date().toISOString(),
    })
    .eq('id', reservationId)
    .eq('is_reservation', true)
    .eq('payment_status', 'pendiente')
    .select('id')

  if (!claimed || claimed.length === 0) {
    return { error: 'Esta reserva ya tenía el pago confirmado.' }
  }

  await notifyReservationPaid(reservationId)
  revalidatePath('/admin/reservations')
  return { ok: true }
}

/** Cambia el estado de una reserva desde el panel. */
export async function updateReservationStatus(reservationId: string, newStatus: string) {
  if (!(await isAdmin())) return { error: 'No autorizado' }

  const valid = [
    'pendiente', 'confirmado', 'en_preparacion',
    'producto_recibido', 'lista_entrega', 'entregado', 'cancelado',
  ]
  if (!valid.includes(newStatus)) return { error: 'Estado inválido' }

  const supabase = await createAdminClient()
  const { error } = await supabase
    .from('orders')
    .update({ status: newStatus, updated_at: new Date().toISOString() })
    .eq('id', reservationId)
    .eq('is_reservation', true)

  if (error) return { error: 'No se pudo actualizar la reserva' }

  // Cancelar una preventa libera su cupo en la ficha del traje
  if (newStatus === 'cancelado') {
    const { data: items } = await supabase
      .from('order_items').select('product_id, incoming_batch_id').eq('order_id', reservationId)
    const ids = (items ?? []).filter((i) => i.incoming_batch_id).map((i) => i.product_id as string)
    if (ids.length) await revalidateProductsById(supabase, ids)
  }

  revalidatePath('/admin/reservations')
  return { ok: true }
}

export interface SizeChangeOption {
  /** Talla nueva (variante del mismo producto). */
  variant_id: string
  size: string
  price: number
  /** Lote en camino al que pasaría; null si la reserva no es preventa. */
  batch_id: string | null
  arrives_from?: string
  arrives_to?: string
  /** Cupos libres del lote (null si no es preventa). */
  available: number | null
}

/**
 * Tallas a las que se puede cambiar una reserva. Una preventa solo puede
 * pasar a tallas que también vengan en camino y tengan cupo libre; una
 * reserva normal puede pasar a cualquier talla activa del mismo producto.
 */
export async function getSizeChangeOptions(itemId: string): Promise<{ options?: SizeChangeOption[]; currentSize?: string; error?: string }> {
  if (!(await isAdmin())) return { error: 'No autorizado' }
  const supabase = await createAdminClient()

  const { data: item } = await supabase
    .from('order_items')
    .select('id, product_id, variant_id, size, quantity, incoming_batch_id')
    .eq('id', itemId)
    .single()
  if (!item) return { error: 'No se encontró el producto de la reserva.' }

  const { data: variants } = await supabase
    .from('product_variants')
    .select('id, size, price, active')
    .eq('product_id', item.product_id)
  const others = (variants ?? []).filter((v) => v.id !== item.variant_id && v.active !== false)

  const options: SizeChangeOption[] = []
  if (item.incoming_batch_id) {
    const { data: batches } = await supabase
      .from('incoming_batches')
      .select('id, variant_id, quantity, arrives_from, arrives_to')
      .eq('product_id', item.product_id)
      .eq('status', 'en_camino')
      .in('variant_id', others.map((v) => v.id))
    const reserved = await reservedByBatch((batches ?? []).map((b) => b.id))
    for (const b of batches ?? []) {
      const v = others.find((o) => o.id === b.variant_id)
      if (!v) continue
      const libres = b.quantity - (reserved.get(b.id) ?? 0)
      if (libres < item.quantity) continue
      options.push({
        variant_id: v.id, size: v.size, price: Number(v.price), batch_id: b.id,
        arrives_from: b.arrives_from, arrives_to: b.arrives_to, available: libres,
      })
    }
  } else {
    for (const v of others) {
      options.push({ variant_id: v.id, size: v.size, price: Number(v.price), batch_id: null, available: null })
    }
  }
  options.sort((a, b) => (Number(a.size) || 9999) - (Number(b.size) || 9999))
  return { options, currentSize: item.size }
}

/**
 * Cambia la talla de una reserva (el cliente se equivocó al reservar).
 * Mantiene lo ya cobrado: no recalcula montos. Si la preventa pasa a otro
 * lote, libera el cupo del anterior y ocupa uno del nuevo.
 */
export async function changeReservationSize(input: { itemId: string; variantId: string; batchId: string | null }) {
  if (!(await isAdmin())) return { error: 'No autorizado' }
  const supabase = await createAdminClient()

  const { data: item } = await supabase
    .from('order_items')
    .select('id, order_id, product_id, variant_id, size, quantity, incoming_batch_id, product_name')
    .eq('id', input.itemId)
    .single()
  if (!item) return { error: 'No se encontró el producto de la reserva.' }

  const { data: order } = await supabase
    .from('orders')
    .select('id, status, is_reservation, notes')
    .eq('id', item.order_id)
    .single()
  if (!order?.is_reservation) return { error: 'Esto no es una reserva.' }
  if (order.status === 'cancelado' || order.status === 'entregado') {
    return { error: 'No se puede cambiar la talla de una reserva cancelada o entregada.' }
  }

  const { data: variant } = await supabase
    .from('product_variants')
    .select('id, size, price, cost_price, active, product_id')
    .eq('id', input.variantId)
    .single()
  if (!variant || variant.active === false || variant.product_id !== item.product_id) {
    return { error: 'Esa talla no está disponible.' }
  }

  let unitCost: number | null = null
  if (item.incoming_batch_id) {
    if (!input.batchId) return { error: 'Elige el lote en camino de la talla nueva.' }
    const { data: b } = await supabase
      .from('incoming_batches')
      .select('id, variant_id, quantity, unit_cost, status')
      .eq('id', input.batchId)
      .single()
    if (!b || b.status !== 'en_camino' || b.variant_id !== variant.id) {
      return { error: 'Ese lote ya no está disponible. Actualiza la página.' }
    }
    const libres = b.quantity - ((await reservedByBatch([b.id])).get(b.id) ?? 0)
    if (libres < item.quantity) return { error: 'Ya no quedan cupos en esa talla en camino.' }
    unitCost = Number(b.unit_cost) > 0 ? Number(b.unit_cost) : Number(variant.cost_price)
  } else {
    unitCost = Number(variant.cost_price)
  }

  const update: Record<string, unknown> = {
    variant_id: variant.id,
    size: variant.size,
    incoming_batch_id: item.incoming_batch_id ? input.batchId : null,
  }
  if (unitCost && unitCost > 0) update.unit_cost = unitCost

  const { error } = await supabase.from('order_items').update(update).eq('id', item.id)
  if (error) return { error: 'No se pudo cambiar la talla.' }

  const hoy = new Date().toLocaleDateString('es-CL', { timeZone: 'America/Santiago' })
  const nota = `Cambio de talla ${item.size} → ${variant.size} (${hoy})`
  await supabase
    .from('orders')
    .update({ notes: order.notes ? `${order.notes} · ${nota}` : nota, updated_at: new Date().toISOString() })
    .eq('id', order.id)

  if (item.incoming_batch_id) await revalidateProductsById(supabase, [item.product_id as string])
  revalidatePath('/admin/reservations')
  revalidatePath('/admin/incoming')
  return { ok: true }
}
