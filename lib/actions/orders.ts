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

  // Verify stock before creating order
  for (const { product, quantity } of cartItems) {
    const { data: current } = await supabase
      .from('products')
      .select('stock, name')
      .eq('id', product.id)
      .single()

    if (!current) return { error: `Producto no encontrado: ${product.name}` }
    if (current.stock < quantity) {
      return { error: `Stock insuficiente para "${product.name}". Disponible: ${current.stock}` }
    }
  }

  const subtotal = cartItems.reduce((sum, { product, quantity }) => sum + product.price * quantity, 0)
  const total = subtotal + shippingCost

  // Create order
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

  // Create order items & update stock
  for (const { product, quantity } of cartItems) {
    await supabase.from('order_items').insert({
      order_id: order.id,
      product_id: product.id,
      product_name: product.name,
      product_image: product.image_url,
      size: product.size,
      color: product.color,
      quantity,
      unit_price: product.price,
      total_price: product.price * quantity,
    })

    const { data: current } = await supabase
      .from('products')
      .select('stock')
      .eq('id', product.id)
      .single()

    const previousStock = current?.stock ?? 0
    const newStock = Math.max(0, previousStock - quantity)

    await supabase
      .from('products')
      .update({ stock: newStock })
      .eq('id', product.id)

    await supabase.from('inventory_movements').insert({
      product_id: product.id,
      type: 'sale',
      quantity,
      reason: `Venta - Pedido #${order.id.slice(0, 8)}`,
      previous_stock: previousStock,
      new_stock: newStock,
      created_by: 'system',
    })

    // Notify low/out stock
    if (newStock === 0) {
      await notifyOutOfStock(product.name)
    } else if (newStock <= LOW_STOCK_THRESHOLD) {
      await notifyLowStock(product.name, newStock)
    }
  }

  // Fetch full order with items for Telegram notification
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
