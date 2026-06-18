import { Order } from '@/types'

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!
const CHAT_ID = process.env.TELEGRAM_CHAT_ID!

async function sendMessage(text: string): Promise<void> {
  if (!BOT_TOKEN || !CHAT_ID) {
    console.warn('[Telegram] Credenciales no configuradas')
    return
  }

  try {
    const res = await fetch(
      `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: CHAT_ID,
          text,
          parse_mode: 'HTML',
        }),
      }
    )

    if (!res.ok) {
      const err = await res.text()
      console.error('[Telegram] Error enviando mensaje:', err)
    }
  } catch (err) {
    console.error('[Telegram] Excepción:', err)
  }
}

function formatDate(date: string) {
  return new Date(date).toLocaleString('es-CL', {
    timeZone: 'America/Santiago',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatPrice(n: number) {
  return `$${n.toLocaleString('es-CL')}`
}

export async function notifyNewOrder(order: Order): Promise<void> {
  const items =
    order.items
      ?.map(
        (i) =>
          `  • ${i.product_name} (T: ${i.size} / ${i.color}) x${i.quantity} = ${formatPrice(i.total_price)}`
      )
      .join('\n') ?? 'Sin detalle'

  const text = `
🕷️ <b>NUEVO PEDIDO #${order.id.slice(0, 8).toUpperCase()}</b>

👤 <b>Cliente:</b> ${order.customer_name}
📞 <b>Teléfono:</b> ${order.customer_phone}
📧 <b>Email:</b> ${order.customer_email}

🛍️ <b>Productos:</b>
${items}

💰 <b>Subtotal:</b> ${formatPrice(order.subtotal)}
🚚 <b>Envío:</b> ${formatPrice(order.shipping_cost)}
💵 <b>TOTAL:</b> ${formatPrice(order.total)}

📦 <b>Método:</b> ${order.delivery_method === 'delivery' ? '🏠 Delivery a domicilio' : '📍 Retiro en Plaza de Maipú'}
${order.delivery_method === 'delivery'
  ? `📍 <b>Dirección:</b> ${order.delivery_address}, ${order.delivery_commune}, ${order.delivery_region ?? ''}\n📌 <b>Referencia:</b> ${order.delivery_reference}`
  : `📅 <b>Día:</b> ${order.pickup_slot === 'martes' ? 'Martes' : 'Sábado'}\n🕐 <b>Hora:</b> ${order.pickup_time ?? '—'}\n💳 <b>Pago:</b> ${order.payment_method === 'transferencia' ? '🏦 Transferencia bancaria' : '💵 Efectivo'}`
}
${order.notes ? `📝 <b>Notas:</b> ${order.notes}` : ''}

🕐 <b>Fecha:</b> ${formatDate(order.created_at)}
`.trim()

  await sendMessage(text)
}

export async function notifyPaymentApproved(
  order: Order,
  amount: number
): Promise<void> {
  const text = `
💚 <b>PAGO APROBADO</b>
📋 <b>Pedido:</b> #${order.id.slice(0, 8).toUpperCase()}
👤 <b>Cliente:</b> ${order.customer_name}
📞 <b>Teléfono:</b> ${order.customer_phone}
💵 <b>Monto:</b> ${formatPrice(amount)}
📦 <b>Método:</b> ${order.delivery_method === 'delivery' ? '🏠 Delivery' : '🏪 Retiro en tienda'}
🕐 <b>Fecha:</b> ${formatDate(new Date().toISOString())}

✅ El pedido ya está pagado, puedes prepararlo.
`.trim()

  await sendMessage(text)
}

export async function notifyOrderStatusChange(
  order: Order,
  newStatus: string
): Promise<void> {
  const statusEmoji: Record<string, string> = {
    confirmado: '✅',
    en_preparacion: '🔧',
    en_reparto: '🚚',
    entregado: '🎉',
    cancelado: '❌',
  }

  const statusLabel: Record<string, string> = {
    confirmado: 'CONFIRMADO',
    en_preparacion: 'EN PREPARACIÓN',
    en_reparto: 'EN REPARTO',
    entregado: 'ENTREGADO',
    cancelado: 'CANCELADO',
  }

  const emoji = statusEmoji[newStatus] ?? '🔄'
  const label = statusLabel[newStatus] ?? newStatus.toUpperCase()

  const text = `
${emoji} <b>PEDIDO ${label}</b>
📋 <b>ID:</b> #${order.id.slice(0, 8).toUpperCase()}
👤 <b>Cliente:</b> ${order.customer_name}
📞 <b>Teléfono:</b> ${order.customer_phone}
💵 <b>Total:</b> ${formatPrice(order.total)}
🕐 <b>Actualizado:</b> ${formatDate(new Date().toISOString())}
`.trim()

  await sendMessage(text)
}

export async function notifyLowStock(
  productName: string,
  stock: number
): Promise<void> {
  const text = `
⚠️ <b>STOCK BAJO</b>
📦 <b>Producto:</b> ${productName}
📊 <b>Stock actual:</b> ${stock} unidades
`.trim()

  await sendMessage(text)
}

export async function notifyOutOfStock(productName: string): Promise<void> {
  const text = `
🚨 <b>STOCK AGOTADO</b>
📦 <b>Producto:</b> ${productName}
❗ Este producto está sin stock disponible.
`.trim()

  await sendMessage(text)
}

export async function notifyProductDeactivated(
  productName: string
): Promise<void> {
  const text = `
🔕 <b>PRODUCTO DESACTIVADO</b>
📦 <b>Producto:</b> ${productName}
Este producto ha sido marcado como inactivo.
`.trim()

  await sendMessage(text)
}

export async function notifyInventoryChange(
  productName: string,
  type: string,
  previousStock: number,
  newStock: number,
  reason: string
): Promise<void> {
  const typeEmoji: Record<string, string> = {
    increase: '📈',
    decrease: '📉',
    adjust: '🔄',
    sale: '🛒',
    return: '↩️',
  }

  const text = `
${typeEmoji[type] ?? '📦'} <b>MOVIMIENTO DE INVENTARIO</b>
📦 <b>Producto:</b> ${productName}
📊 <b>Stock anterior:</b> ${previousStock}
📊 <b>Stock nuevo:</b> ${newStock}
📝 <b>Motivo:</b> ${reason}
🕐 <b>Fecha:</b> ${formatDate(new Date().toISOString())}
`.trim()

  await sendMessage(text)
}
