import { Order } from '@/types'
import { sendMessage } from '@/lib/telegram'
import { sendPushToAdmins } from '@/lib/push'

/**
 * Aviso inmediato de que alguien INICIÓ un pedido o una reserva, aunque
 * todavía no haya pagado.
 *
 * Antes solo se avisaba cuando el pago quedaba confirmado, así que un pedido
 * por transferencia, o una reserva que el cliente dejaba a medio pagar, no
 * generaba ningún aviso: el dueño se enteraba solo si abría el panel. Una
 * reserva por transferencia llegó a crearse y cancelarse sin que nadie la
 * viera.
 *
 * Va por Telegram y push a propósito: son gratis e ilimitados. El correo
 * (que sí tiene cupo mensual) sigue saliendo únicamente al confirmarse el
 * pago, así que no se suma ningún correo por esto.
 */
export async function notifyOrderStarted(order: Order): Promise<void> {
  try {
    const esReserva = order.is_reservation === true
    const codigo = order.id.slice(0, 8).toUpperCase()
    const total = `$${Number(order.total).toLocaleString('es-CL')}`
    const metodo =
      order.payment_method === 'transferencia'
        ? '🏦 Transferencia — revisa tu banco'
        : order.payment_method === 'efectivo'
          ? '💵 Efectivo'
          : '💳 Mercado Pago'

    const items =
      order.items?.map((i) => `  • ${i.product_name} (T: ${i.size}) x${i.quantity}`).join('\n') ?? ''

    const titulo = esReserva ? '📅 RESERVA INICIADA' : '🛒 PEDIDO INICIADO'

    await sendMessage(
      `
${titulo} #${codigo}
⏳ <b>Esperando el pago</b>

👤 ${order.customer_name}
📞 ${order.customer_phone}
${items ? `\n${items}\n` : ''}
💵 <b>Total:</b> ${total}
💳 <b>Pago:</b> ${metodo}
${esReserva && order.needed_by ? `📆 <b>Lo necesita para:</b> ${order.needed_by}\n` : ''}
Te avisaremos de nuevo cuando se confirme el pago.
`.trim()
    )

    await sendPushToAdmins(
      esReserva ? '📅 Reserva iniciada (sin pagar)' : '🛒 Pedido iniciado (sin pagar)',
      `${order.customer_name} — ${total}`,
      esReserva ? '/admin/reservations' : '/admin/orders'
    )
  } catch (err) {
    // Un aviso que falla nunca debe tumbar la compra del cliente.
    console.error('[Alertas] No se pudo avisar del pedido iniciado:', err)
  }
}
