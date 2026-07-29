import { Resend } from 'resend'
import { Order } from '@/types'

const API_KEY = process.env.RESEND_API_KEY
// Debe ser un dominio verificado en Resend. Mientras no lo esté, se puede usar
// 'onboarding@resend.dev' (solo envía a la casilla del dueño de la cuenta).
const FROM = process.env.RESEND_FROM || 'AracnidaStore <onboarding@resend.dev>'
const STORE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://aracnidastore.com'
const WHATSAPP = '56978829942'

const TRANSFER_INFO = {
  banco: 'Banco Estado',
  tipo: 'Cuenta RUT',
  nombre: 'Diego Gutierrez',
  rut: '21.481.177-4',
}

const PICKUP_LABELS: Record<string, string> = { martes: 'Martes', sabado: 'Sábado' }

export const isEmailEnabled = () => Boolean(API_KEY)

function money(n: number) {
  return `$${Number(n).toLocaleString('es-CL')}`
}

function esc(s: string) {
  return String(s).replace(/[<>&]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' })[c]!)
}

function buildHtml(order: Order): string {
  const shortId = order.id.slice(0, 8).toUpperCase()
  const isRetiro = order.delivery_method === 'retiro'

  const itemRows = (order.items ?? [])
    .map(
      (i) => `
      <tr>
        <td style="padding:12px 0;border-bottom:1px solid #eee;">
          <div style="font-weight:600;color:#1a2744;">${esc(i.product_name)}</div>
          <div style="font-size:13px;color:#888;">Talla ${esc(i.size)} · Cantidad ${i.quantity}</div>
        </td>
        <td style="padding:12px 0;border-bottom:1px solid #eee;text-align:right;font-weight:700;color:#1a2744;white-space:nowrap;">
          ${money(i.total_price)}
        </td>
      </tr>`
    )
    .join('')

  const entregaBlock = isRetiro
    ? `
      <p style="margin:0 0 6px;"><strong>Retiro en Metro Plaza de Maipú</strong></p>
      <p style="margin:0 0 4px;color:#555;">Día: <strong>${esc(PICKUP_LABELS[order.pickup_slot ?? ''] ?? 'Por coordinar')}</strong></p>
      <p style="margin:0 0 4px;color:#555;">Hora: <strong>${esc(order.pickup_time ?? 'Por coordinar')}</strong></p>
      <p style="margin:0;color:#555;">Pago: <strong>${order.payment_method === 'transferencia' ? 'Transferencia bancaria' : 'Efectivo'}</strong></p>
      <p style="margin:12px 0 0;padding:10px;background:#fff8e1;border-radius:8px;font-size:13px;color:#8a6d1a;">
        Recuerda confirmar tu retiro con al menos 24 horas de anticipación por WhatsApp.
      </p>`
    : `
      <p style="margin:0 0 6px;"><strong>Envío a domicilio</strong></p>
      <p style="margin:0 0 4px;color:#555;">${esc(order.delivery_address)}</p>
      <p style="margin:0 0 4px;color:#555;">${esc(order.delivery_commune)}${order.delivery_region ? `, ${esc(order.delivery_region)}` : ''}</p>
      ${order.delivery_reference ? `<p style="margin:0;color:#888;font-size:13px;">Referencia: ${esc(order.delivery_reference)}</p>` : ''}`

  const transferBlock =
    isRetiro && order.payment_method === 'transferencia'
      ? `
      <div style="margin:24px 0;padding:16px;background:#f4f7ff;border:1px solid #d9e2ff;border-radius:12px;">
        <p style="margin:0 0 10px;font-weight:700;color:#1a2744;">Datos para transferir</p>
        <p style="margin:0 0 3px;color:#555;">Banco: <strong>${TRANSFER_INFO.banco}</strong></p>
        <p style="margin:0 0 3px;color:#555;">Tipo: <strong>${TRANSFER_INFO.tipo}</strong></p>
        <p style="margin:0 0 3px;color:#555;">Nombre: <strong>${TRANSFER_INFO.nombre}</strong></p>
        <p style="margin:0 0 3px;color:#555;">RUT: <strong>${TRANSFER_INFO.rut}</strong></p>
        <p style="margin:10px 0 0;color:#555;">Monto: <strong>${money(order.total)}</strong></p>
        <p style="margin:10px 0 0;font-size:13px;color:#888;">
          Envíanos el comprobante por WhatsApp indicando tu número de pedido #${shortId}.
        </p>
      </div>`
      : ''

  return `<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f5f4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:24px 16px;">

    <div style="background:linear-gradient(135deg,#1a2744,#0f1e3d);border-radius:16px 16px 0 0;padding:32px 28px;text-align:center;">
      <h1 style="margin:0;color:#fff;font-size:24px;font-weight:900;letter-spacing:-.5px;">
        Aracnida<span style="color:#e74c3c;">Store</span>
      </h1>
      <p style="margin:8px 0 0;color:rgba(255,255,255,.6);font-size:14px;">Comprobante de pedido</p>
    </div>

    <div style="background:#fff;padding:28px;border-radius:0 0 16px 16px;">
      <p style="margin:0 0 4px;font-size:16px;color:#1a2744;">Hola <strong>${esc(order.customer_name)}</strong>,</p>
      <p style="margin:0 0 24px;color:#555;line-height:1.6;">
        ¡Gracias por tu compra! Recibimos tu pedido correctamente. Aquí tienes el detalle.
      </p>

      <div style="display:inline-block;padding:8px 16px;background:#f5f5f4;border-radius:999px;margin-bottom:24px;">
        <span style="font-size:12px;color:#888;">Pedido</span>
        <strong style="font-family:monospace;color:#1a2744;margin-left:6px;">#${shortId}</strong>
      </div>

      <table style="width:100%;border-collapse:collapse;margin-bottom:8px;">
        <thead>
          <tr><th colspan="2" style="text-align:left;padding-bottom:8px;font-size:12px;text-transform:uppercase;letter-spacing:1px;color:#aaa;border-bottom:2px solid #1a2744;">Productos</th></tr>
        </thead>
        <tbody>${itemRows}</tbody>
      </table>

      <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
        <tr><td style="padding:6px 0;color:#555;">Subtotal</td><td style="padding:6px 0;text-align:right;color:#1a2744;">${money(order.subtotal)}</td></tr>
        <tr><td style="padding:6px 0;color:#555;">Envío</td><td style="padding:6px 0;text-align:right;color:${Number(order.shipping_cost) === 0 ? '#15803d' : '#1a2744'};">${Number(order.shipping_cost) === 0 ? 'Gratis' : money(order.shipping_cost)}</td></tr>
        <tr>
          <td style="padding:12px 0 0;border-top:2px solid #1a2744;font-weight:800;color:#1a2744;font-size:17px;">Total</td>
          <td style="padding:12px 0 0;border-top:2px solid #1a2744;text-align:right;font-weight:900;color:#c0392b;font-size:20px;">${money(order.total)}</td>
        </tr>
      </table>

      <div style="padding:16px;background:#fafafa;border-radius:12px;margin-bottom:8px;">
        <p style="margin:0 0 10px;font-size:12px;text-transform:uppercase;letter-spacing:1px;color:#aaa;">Entrega</p>
        ${entregaBlock}
      </div>

      ${transferBlock}

      <div style="text-align:center;margin:28px 0 8px;">
        <a href="${STORE_URL}/order-success/${order.id}"
           style="display:inline-block;background:linear-gradient(135deg,#c0392b,#e74c3c);color:#fff;text-decoration:none;padding:14px 32px;border-radius:12px;font-weight:700;">
          Ver estado de mi pedido
        </a>
      </div>

      <p style="margin:24px 0 0;text-align:center;color:#888;font-size:13px;line-height:1.6;">
        ¿Dudas con tu pedido?<br>
        Escríbenos por <a href="https://wa.me/${WHATSAPP}?text=${encodeURIComponent(`Hola! Consulta sobre mi pedido #${shortId}`)}" style="color:#c0392b;font-weight:600;">WhatsApp</a>
      </p>
    </div>

    <p style="text-align:center;color:#aaa;font-size:12px;margin:20px 0 0;">
      AracnidaStore · Santiago, Chile<br>
      Este es un comprobante automático de tu pedido.
    </p>
  </div>
</body></html>`
}

/**
 * Envía el comprobante del pedido al correo del cliente.
 * Si no hay RESEND_API_KEY configurada, no hace nada (no rompe la compra).
 */
export async function sendOrderReceipt(order: Order): Promise<void> {
  if (!API_KEY) {
    console.warn('[Email] RESEND_API_KEY no configurada, no se envía comprobante')
    return
  }
  if (!order.customer_email) return

  try {
    const resend = new Resend(API_KEY)
    const { error } = await resend.emails.send({
      from: FROM,
      to: order.customer_email,
      subject: `Comprobante de tu pedido #${order.id.slice(0, 8).toUpperCase()} — AracnidaStore`,
      html: buildHtml(order),
    })
    if (error) console.error('[Email] Error enviando comprobante:', error)
  } catch (err) {
    // Nunca dejamos que un fallo de correo rompa el flujo de compra
    console.error('[Email] Excepción enviando comprobante:', err)
  }
}
