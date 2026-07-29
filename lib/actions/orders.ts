'use server'

import { createAdminClient, createClient } from '@/lib/supabase/server'
import { notifyNewOrder, notifyLowStock, notifyOutOfStock } from '@/lib/telegram'
import { sendOrderReceipt } from '@/lib/email'
import { CheckoutFormData } from '@/lib/validations'
import { CartItem } from '@/types'
import { calcShippingCost } from '@/lib/shipping'

const LOW_STOCK_THRESHOLD = 3
const MAX_QTY_PER_ITEM = 20

export async function createOrder(
  formData: CheckoutFormData,
  cartItems: CartItem[]
) {
  if (!cartItems.length) return { error: 'El carrito está vacío' }
  if (cartItems.length > 50) return { error: 'Demasiados productos en el carrito' }

  // Libera el stock de checkouts abandonados antes de validar disponibilidad,
  // para no rechazar una venta real por stock que nadie llegó a pagar.
  await releaseExpiredOrders()

  const supabase = await createAdminClient()

  // Validar stock y recalcular el precio de cada variante DESDE LA BASE DE DATOS.
  // Nunca se confía en el precio que llega desde el navegador (evita manipulación).
  const pricedItems: { item: CartItem; price: number }[] = []

  for (const cartItem of cartItems) {
    const { product, variant, quantity } = cartItem

    if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_QTY_PER_ITEM) {
      return { error: `Cantidad inválida para "${product.name}"` }
    }

    const { data: current } = await supabase
      .from('product_variants')
      .select('stock, price, active')
      .eq('id', variant.id)
      .single()

    if (!current || current.active === false) {
      return { error: `Producto no disponible: ${product.name} (${variant.size})` }
    }
    if (current.stock < quantity) {
      return { error: `Stock insuficiente para "${product.name}" talla ${variant.size}. Disponible: ${current.stock}` }
    }

    pricedItems.push({ item: cartItem, price: Number(current.price) })
  }

  const subtotal = pricedItems.reduce((sum, { item, price }) => sum + price * item.quantity, 0)
  // El costo de envío se calcula en el servidor según la región y el método.
  const shippingCost = calcShippingCost(formData.delivery_method, formData.delivery_region, subtotal)
  const total = subtotal + shippingCost

  // Crear pedido
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      customer_name: formData.customer_name,
      customer_email: formData.customer_email,
      customer_phone: formData.customer_phone,
      subtotal,
      shipping_cost: shippingCost,
      discount: 0,
      total,
      delivery_method: formData.delivery_method,
      delivery_address: formData.delivery_method === 'retiro' ? 'Plaza de Maipú' : (formData.delivery_address ?? ''),
      delivery_region: formData.delivery_method === 'retiro' ? 'Región Metropolitana de Santiago' : (formData.delivery_region ?? ''),
      delivery_commune: formData.delivery_method === 'retiro' ? 'Maipú' : (formData.delivery_commune ?? ''),
      delivery_reference: formData.delivery_reference ?? '',
      pickup_slot: formData.pickup_slot ?? null,
      pickup_time: formData.pickup_time ?? null,
      pickup_date: formData.pickup_date ?? null,
      payment_method: formData.payment_method ?? null,
      status: 'pendiente',
      payment_status: 'pendiente',
      notes: formData.notes ?? '',
    })
    .select()
    .single()

  if (orderError || !order) {
    console.error('[Order] Error creando pedido:', orderError)
    return { error: 'Error al crear el pedido. Intenta nuevamente.' }
  }

  // Items del pedido y descuento de stock por variante
  for (const { item: { product, variant, quantity }, price } of pricedItems) {
    await supabase.from('order_items').insert({
      order_id: order.id,
      product_id: product.id,
      variant_id: variant.id,
      product_name: product.name,
      product_image: product.image_url,
      size: variant.size,
      color: product.color,
      quantity,
      unit_price: price,
      total_price: price * quantity,
    })

    // Descontar stock de la variante
    const { data: currentVariant } = await supabase
      .from('product_variants')
      .select('stock')
      .eq('id', variant.id)
      .single()

    const previousStock = currentVariant?.stock ?? 0
    const newStock = Math.max(0, previousStock - quantity)

    await supabase.from('product_variants').update({ stock: newStock, updated_at: new Date().toISOString() }).eq('id', variant.id)

    // Recalcular stock agregado del producto
    const { data: allVariants } = await supabase
      .from('product_variants')
      .select('stock')
      .eq('product_id', product.id)
    const productStock = (allVariants ?? []).reduce((s, v) => s + v.stock, 0)
    await supabase.from('products').update({ stock: productStock }).eq('id', product.id)

    await supabase.from('inventory_movements').insert({
      product_id: product.id,
      variant_id: variant.id,
      type: 'sale',
      quantity,
      reason: `Venta - Pedido #${order.id.slice(0, 8)} (Talla ${variant.size})`,
      previous_stock: previousStock,
      new_stock: newStock,
      created_by: 'system',
    })

    // Notificaciones de stock
    if (productStock === 0) {
      await notifyOutOfStock(product.name)
    } else if (productStock <= LOW_STOCK_THRESHOLD) {
      await notifyLowStock(product.name, productStock)
    }
  }

  // Pedido completo para notificación Telegram
  const { data: fullOrder } = await supabase
    .from('orders')
    .select('*, items:order_items(*)')
    .eq('id', order.id)
    .single()

  // Para retiro (efectivo/transferencia) notificamos de inmediato porque no hay pago online.
  // Para delivery, esperamos la confirmación de MercadoPago en el webhook.
  if (fullOrder && formData.delivery_method === 'retiro') {
    await notifyNewOrder(fullOrder)
    await sendOrderReceipt(fullOrder)
  }

  return { orderId: order.id }
}

// Recalcula el stock agregado de un producto como suma de sus variantes
async function recalcProductStock(
  supabase: Awaited<ReturnType<typeof createAdminClient>>,
  productId: string
) {
  const { data: allVariants } = await supabase
    .from('product_variants')
    .select('stock')
    .eq('product_id', productId)
  const productStock = (allVariants ?? []).reduce((s, v) => s + v.stock, 0)
  await supabase.from('products').update({ stock: productStock }).eq('id', productId)
  return productStock
}

/**
 * Devuelve al stock todas las unidades de un pedido (una sola vez).
 * Se usa al cancelar o al expirar un pedido sin pagar.
 */
async function returnStockForOrder(
  supabase: Awaited<ReturnType<typeof createAdminClient>>,
  orderId: string,
  reason: string
) {
  const { data: items } = await supabase
    .from('order_items')
    .select('product_id, variant_id, size, quantity')
    .eq('order_id', orderId)

  for (const item of items ?? []) {
    if (!item.variant_id) continue

    const { data: currentVariant } = await supabase
      .from('product_variants')
      .select('stock')
      .eq('id', item.variant_id)
      .single()

    const previousStock = currentVariant?.stock ?? 0
    const newStock = previousStock + item.quantity

    await supabase
      .from('product_variants')
      .update({ stock: newStock, updated_at: new Date().toISOString() })
      .eq('id', item.variant_id)

    await recalcProductStock(supabase, item.product_id)

    await supabase.from('inventory_movements').insert({
      product_id: item.product_id,
      variant_id: item.variant_id,
      type: 'return',
      quantity: item.quantity,
      reason: `${reason} (Talla ${item.size})`,
      previous_stock: previousStock,
      new_stock: newStock,
      created_by: 'system',
    })
  }
}

// Minutos que se mantiene reservado el stock de un pedido con pago en línea sin completar
const PAYMENT_WINDOW_MINUTES = 45

/**
 * Cancela los pedidos con pago en línea que quedaron sin pagar y devuelve su stock.
 * Sin esto, cada checkout abandonado en Mercado Pago dejaba el stock perdido para siempre.
 * Se ejecuta de forma perezosa (al crear un pedido y al abrir el panel de pedidos).
 */
export async function releaseExpiredOrders() {
  const supabase = await createAdminClient()
  const cutoff = new Date(Date.now() - PAYMENT_WINDOW_MINUTES * 60_000).toISOString()

  const { data: expired } = await supabase
    .from('orders')
    .select('id')
    .eq('status', 'pendiente')
    .eq('payment_status', 'pendiente')
    .eq('delivery_method', 'delivery')
    .lt('created_at', cutoff)

  if (!expired?.length) return { released: 0 }

  for (const order of expired) {
    await returnStockForOrder(
      supabase,
      order.id,
      `Pago no completado - Pedido #${order.id.slice(0, 8)}`
    )
    await supabase
      .from('orders')
      .update({ status: 'cancelado', updated_at: new Date().toISOString() })
      .eq('id', order.id)
  }

  return { released: expired.length }
}

/**
 * Vuelve a descontar el stock de un pedido que había sido cancelado por
 * expiración pero cuyo pago terminó llegando (carrera entre el corte de 45 min
 * y el pago real). Devuelve true si logró reservar todo el stock.
 */
export async function reclaimStockForPaidOrder(orderId: string): Promise<boolean> {
  const supabase = await createAdminClient()

  const { data: items } = await supabase
    .from('order_items')
    .select('product_id, variant_id, size, quantity')
    .eq('order_id', orderId)

  let complete = true

  for (const item of items ?? []) {
    if (!item.variant_id) continue

    const { data: currentVariant } = await supabase
      .from('product_variants')
      .select('stock')
      .eq('id', item.variant_id)
      .single()

    const previousStock = currentVariant?.stock ?? 0
    if (previousStock < item.quantity) complete = false
    const newStock = Math.max(0, previousStock - item.quantity)

    await supabase
      .from('product_variants')
      .update({ stock: newStock, updated_at: new Date().toISOString() })
      .eq('id', item.variant_id)

    await recalcProductStock(supabase, item.product_id)

    await supabase.from('inventory_movements').insert({
      product_id: item.product_id,
      variant_id: item.variant_id,
      type: 'sale',
      quantity: item.quantity,
      reason: `Pago recibido tras expiración - Pedido #${orderId.slice(0, 8)} (Talla ${item.size})`,
      previous_stock: previousStock,
      new_stock: newStock,
      created_by: 'system',
    })
  }

  return complete
}

/**
 * Marca el estado de pago de un pedido. Pensado para los pedidos con retiro
 * (efectivo/transferencia), donde el pago ocurre fuera de línea y alguien
 * tiene que registrarlo a mano.
 */
export async function updatePaymentStatus(orderId: string, newPaymentStatus: string) {
  const auth = await createClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user) return { error: 'No autorizado' }

  const VALID = ['pendiente', 'pagado', 'rechazado', 'reembolsado']
  if (!VALID.includes(newPaymentStatus)) return { error: 'Estado de pago inválido' }

  const supabase = await createAdminClient()
  const { error } = await supabase
    .from('orders')
    .update({ payment_status: newPaymentStatus, updated_at: new Date().toISOString() })
    .eq('id', orderId)

  if (error) return { error: 'No se pudo actualizar el estado de pago' }
  return { ok: true }
}

/**
 * Cambia el estado de un pedido y ajusta el stock automáticamente:
 * - Al pasar a "cancelado": devuelve al stock las unidades del pedido (movimiento "return").
 * - Al sacar de "cancelado" (reactivar): vuelve a descontar el stock (movimiento "sale").
 * Es idempotente: el stock solo se mueve cuando cambia el "cancelado" real del pedido.
 */
export async function updateOrderStatus(orderId: string, newStatus: string) {
  // Solo administradores autenticados pueden cambiar el estado de un pedido.
  const auth = await createClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user) return { error: 'No autorizado' }

  const supabase = await createAdminClient()

  const { data: order } = await supabase
    .from('orders')
    .select('id, status, payment_status, delivery_method')
    .eq('id', orderId)
    .single()

  if (!order) return { error: 'Pedido no encontrado' }
  if (order.status === newStatus) return { ok: true }

  // Coherencia: no se puede entregar un pedido cuyo pago fue rechazado.
  if (newStatus === 'entregado' && order.payment_status === 'rechazado') {
    return {
      error: 'Este pedido tiene el pago rechazado. Marca el pago como pagado antes de entregarlo.',
    }
  }

  const wasCancelled = order.status === 'cancelado'
  const willBeCancelled = newStatus === 'cancelado'

  const update: Record<string, string> = {
    status: newStatus,
    updated_at: new Date().toISOString(),
  }

  // En retiro el cliente paga en persona: al entregar, el pago queda saldado.
  let autoPaid = false
  if (
    newStatus === 'entregado' &&
    order.delivery_method === 'retiro' &&
    order.payment_status === 'pendiente'
  ) {
    update.payment_status = 'pagado'
    autoPaid = true
  }

  const { error: updErr } = await supabase.from('orders').update(update).eq('id', orderId)
  if (updErr) return { error: 'No se pudo actualizar el estado del pedido' }

  // Ajuste de stock solo si cruza la frontera de "cancelado"
  if (willBeCancelled) {
    await returnStockForOrder(
      supabase,
      orderId,
      `Devolución por cancelación - Pedido #${orderId.slice(0, 8)}`
    )
  } else if (wasCancelled) {
    // Reactivar un pedido cancelado: vuelve a descontar el stock
    const { data: items } = await supabase
      .from('order_items')
      .select('product_id, variant_id, size, quantity')
      .eq('order_id', orderId)

    for (const item of items ?? []) {
      if (!item.variant_id) continue

      const { data: currentVariant } = await supabase
        .from('product_variants')
        .select('stock')
        .eq('id', item.variant_id)
        .single()

      const previousStock = currentVariant?.stock ?? 0
      const newStock = Math.max(0, previousStock - item.quantity)

      await supabase
        .from('product_variants')
        .update({ stock: newStock, updated_at: new Date().toISOString() })
        .eq('id', item.variant_id)

      await recalcProductStock(supabase, item.product_id)

      await supabase.from('inventory_movements').insert({
        product_id: item.product_id,
        variant_id: item.variant_id,
        type: 'sale',
        quantity: item.quantity,
        reason: `Reactivación de pedido #${orderId.slice(0, 8)} (Talla ${item.size})`,
        previous_stock: previousStock,
        new_stock: newStock,
        created_by: 'admin',
      })
    }
  }

  return { ok: true, autoPaid }
}
