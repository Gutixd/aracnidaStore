'use server'

import { createAdminClient } from '@/lib/supabase/server'
import { notifyNewOrder, notifyLowStock, notifyOutOfStock } from '@/lib/telegram'
import { CheckoutFormData } from '@/lib/validations'
import { CartItem } from '@/types'

const LOW_STOCK_THRESHOLD = 3

export async function createOrder(
  formData: CheckoutFormData,
  cartItems: CartItem[],
  shippingCost: number
) {
  if (!cartItems.length) return { error: 'El carrito está vacío' }

  const supabase = await createAdminClient()

  // Verificar stock de cada variante antes de crear el pedido
  for (const { product, variant, quantity } of cartItems) {
    const { data: current } = await supabase
      .from('product_variants')
      .select('stock')
      .eq('id', variant.id)
      .single()

    if (!current) return { error: `Variante no encontrada: ${product.name} (${variant.size})` }
    if (current.stock < quantity) {
      return { error: `Stock insuficiente para "${product.name}" talla ${variant.size}. Disponible: ${current.stock}` }
    }
  }

  const subtotal = cartItems.reduce((sum, { variant, quantity }) => sum + variant.price * quantity, 0)
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
      delivery_address: formData.delivery_address ?? '',
      delivery_commune: formData.delivery_commune ?? '',
      delivery_reference: formData.delivery_reference ?? '',
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
  for (const { product, variant, quantity } of cartItems) {
    await supabase.from('order_items').insert({
      order_id: order.id,
      product_id: product.id,
      variant_id: variant.id,
      product_name: product.name,
      product_image: product.image_url,
      size: variant.size,
      color: product.color,
      quantity,
      unit_price: variant.price,
      total_price: variant.price * quantity,
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

  if (fullOrder) {
    await notifyNewOrder(fullOrder)
  }

  return { orderId: order.id }
}
