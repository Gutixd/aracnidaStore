import { Resend } from 'resend'
import { Order } from '@/types'
import { PICKUP_PLACE, PICKUP_SLOT_LABELS, formatPickupDate } from '@/lib/pickup'
import { createAdminClient } from '@/lib/supabase/server'

const API_KEY = process.env.RESEND_API_KEY
// Debe ser un dominio verificado en Resend. Mientras no lo esté, se puede usar
// 'onboarding@resend.dev' (solo envía a la casilla del dueño de la cuenta).
const FROM = process.env.RESEND_FROM || 'AracnidaStore <onboarding@resend.dev>'
const STORE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://aracnidastore.com'
const WHATSAPP = '56978829942'
// Casilla del dueño, donde llegan los avisos de pedido nuevo.
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'chinitobnlokillo@gmail.com'

const TRANSFER_INFO = {
  banco: 'Banco Estado',
  tipo: 'Cuenta RUT',
  nombre: 'Diego Gutierrez',
  rut: '21.481.177-4',
}


export const isEmailEnabled = () => Boolean(API_KEY)

function money(n: number) {
  return `$${Number(n).toLocaleString('es-CL')}`
}

function esc(s: string) {
  return String(s).replace(/[<>&]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' })[c]!)
}

function buildHtml(order: Order, reviewSlug?: string | null): string {
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
      <p style="margin:0 0 6px;"><strong>Retiro en ${PICKUP_PLACE}</strong></p>
      <p style="margin:0 0 4px;color:#555;">Día: <strong style="text-transform:capitalize;">${esc(order.pickup_date ? formatPickupDate(order.pickup_date) : (PICKUP_SLOT_LABELS[order.pickup_slot ?? ''] ?? 'Por coordinar'))}</strong></p>
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

  // Invitación a dejar reseña. Enlaza al producto comprado con el número de
  // pedido, para que la reseña quede marcada como compra verificada.
  const reviewUrl = reviewSlug
    ? `${STORE_URL}/products/${reviewSlug}#resenas`
    : `${STORE_URL}/products`
  const reviewBlock = `
      <div style="margin:24px 0 8px;padding:18px;background:#fffbeb;border:1px solid #fde68a;border-radius:12px;text-align:center;">
        <p style="margin:0 0 6px;font-weight:700;color:#92400e;">¿Nos ayudas con una reseña?</p>
        <p style="margin:0 0 14px;color:#a16207;font-size:14px;line-height:1.5;">
          Cuando recibas tu pedido, cuéntanos qué te pareció. Tu opinión ayuda a otros clientes a decidir.
        </p>
        <a href="${reviewUrl}"
           style="display:inline-block;background:#f59e0b;color:#fff;text-decoration:none;padding:11px 26px;border-radius:10px;font-weight:700;font-size:14px;">
          Dejar mi reseña
        </a>
        <p style="margin:12px 0 0;font-size:12px;color:#b45309;">
          Ingresa el código <strong>${shortId}</strong> para que aparezca como compra verificada.
        </p>
      </div>`

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
        ${Number(order.discount ?? 0) > 0 ? `<tr><td style="padding:6px 0;color:#555;">Descuento</td><td style="padding:6px 0;text-align:right;color:#15803d;">−${money(Number(order.discount))}</td></tr>` : ''}
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

      ${reviewBlock}

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
    // Slug del primer producto, para enlazar la invitación a dejar reseña
    let reviewSlug: string | null = null
    const firstProductId = (order.items ?? [])[0]?.product_id
    if (firstProductId) {
      try {
        const supabase = await createAdminClient()
        const { data } = await supabase
          .from('products')
          .select('slug')
          .eq('id', firstProductId)
          .maybeSingle()
        reviewSlug = data?.slug ?? null
      } catch {
        // Si falla, el correo enlaza al catálogo general
      }
    }

    const resend = new Resend(API_KEY)
    const { error } = await resend.emails.send({
      from: FROM,
      to: order.customer_email,
      subject: `✅ Confirmación de pedido #${order.id.slice(0, 8).toUpperCase()} — AracnidaStore`,
      html: buildHtml(order, reviewSlug),
    })
    if (error) console.error('[Email] Error enviando comprobante:', error)
  } catch (err) {
    // Nunca dejamos que un fallo de correo rompa el flujo de compra
    console.error('[Email] Excepción enviando comprobante:', err)
  }
}

function formatFullDate(date: string) {
  return new Date(date).toLocaleString('es-CL', {
    timeZone: 'America/Santiago',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const PAYMENT_LABELS: Record<string, string> = {
  transferencia: 'Transferencia bancaria',
  efectivo: 'Efectivo',
  mercadopago: 'Mercado Pago',
}

/** Fila de dato etiqueta/valor, para los bloques de cliente y entrega. */
function infoRow(label: string, value: string): string {
  return `
    <tr>
      <td style="padding:5px 0;color:#888;font-size:13px;width:120px;vertical-align:top;">${esc(label)}</td>
      <td style="padding:5px 0;color:#1a2744;font-size:14px;font-weight:600;">${value}</td>
    </tr>`
}

function buildAdminHtml(order: Order): string {
  const shortId = order.id.slice(0, 8).toUpperCase()
  const isRetiro = order.delivery_method === 'retiro'
  const discount = Number(order.discount ?? 0)

  const itemRows = (order.items ?? [])
    .map((i) => {
      // La miniatura es opcional: si el producto no tiene imagen guardada, se
      // muestra solo el texto en vez de un recuadro roto.
      const thumb = i.product_image
        ? `<img src="${esc(i.product_image)}" width="56" height="56" alt=""
             style="width:56px;height:56px;object-fit:cover;border-radius:8px;display:block;background:#f5f5f4;">`
        : `<div style="width:56px;height:56px;border-radius:8px;background:#f5f5f4;"></div>`

      return `
      <tr>
        <td style="padding:12px 0;border-bottom:1px solid #eee;width:56px;">${thumb}</td>
        <td style="padding:12px 12px;border-bottom:1px solid #eee;">
          <div style="font-weight:600;color:#1a2744;font-size:14px;">${esc(i.product_name)}</div>
          <div style="font-size:13px;color:#888;margin-top:2px;">
            Talla ${esc(i.size)}${i.color ? ` · ${esc(i.color)}` : ''}
          </div>
          <div style="font-size:13px;color:#888;margin-top:2px;">
            ${i.quantity} × ${money(i.unit_price)}
          </div>
        </td>
        <td style="padding:12px 0;border-bottom:1px solid #eee;text-align:right;font-weight:700;color:#1a2744;white-space:nowrap;font-size:14px;">
          ${money(i.total_price)}
        </td>
      </tr>`
    })
    .join('')

  const entregaRows = isRetiro
    ? [
        infoRow('Método', '📍 Retiro en persona'),
        infoRow('Lugar', esc(PICKUP_PLACE)),
        infoRow(
          'Día',
          `<span style="text-transform:capitalize;">${esc(
            order.pickup_date
              ? formatPickupDate(order.pickup_date)
              : PICKUP_SLOT_LABELS[order.pickup_slot ?? ''] ?? 'Por coordinar'
          )}</span>`
        ),
        infoRow('Hora', esc(order.pickup_time ?? 'Por coordinar')),
      ].join('')
    : [
        infoRow('Método', '🚚 Envío a domicilio'),
        infoRow('Dirección', esc(order.delivery_address ?? '—')),
        infoRow(
          'Comuna',
          `${esc(order.delivery_commune ?? '—')}${
            order.delivery_region ? `, ${esc(order.delivery_region)}` : ''
          }`
        ),
        order.delivery_reference
          ? infoRow('Referencia', esc(order.delivery_reference))
          : '',
      ].join('')

  return `<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f5f4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:24px 16px;">

    <div style="background:linear-gradient(135deg,#1a2744,#0f1e3d);border-radius:16px 16px 0 0;padding:28px;text-align:center;">
      <h1 style="margin:0;color:#fff;font-size:22px;font-weight:900;letter-spacing:-.5px;">
        Aracnida<span style="color:#e74c3c;">Store</span>
      </h1>
      <p style="margin:8px 0 0;color:rgba(255,255,255,.65);font-size:14px;">🛒 Nuevo pedido recibido</p>
    </div>

    <div style="background:#fff;padding:28px;border-radius:0 0 16px 16px;">

      <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
        <tr>
          <td style="vertical-align:top;">
            <div style="font-size:12px;text-transform:uppercase;letter-spacing:1px;color:#aaa;">Pedido</div>
            <div style="font-family:monospace;font-size:20px;font-weight:800;color:#1a2744;margin-top:2px;">#${shortId}</div>
          </td>
          <td style="vertical-align:top;text-align:right;">
            <div style="font-size:12px;text-transform:uppercase;letter-spacing:1px;color:#aaa;">Total</div>
            <div style="font-size:24px;font-weight:900;color:#c0392b;margin-top:2px;">${money(order.total)}</div>
          </td>
        </tr>
      </table>

      <p style="margin:0 0 24px;padding:10px 14px;background:#f5f5f4;border-radius:8px;font-size:13px;color:#666;">
        🕐 ${esc(formatFullDate(order.created_at))}
      </p>

      <div style="font-size:12px;text-transform:uppercase;letter-spacing:1px;color:#aaa;border-bottom:2px solid #1a2744;padding-bottom:8px;margin-bottom:10px;">Cliente</div>
      <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
        ${infoRow('Nombre', esc(order.customer_name))}
        ${infoRow('Email', `<a href="mailto:${esc(order.customer_email)}" style="color:#c0392b;text-decoration:none;">${esc(order.customer_email)}</a>`)}
        ${order.customer_phone ? infoRow('Teléfono', `<a href="https://wa.me/${esc(String(order.customer_phone).replace(/\D/g, ''))}" style="color:#c0392b;text-decoration:none;">${esc(order.customer_phone)}</a>`) : ''}
      </table>

      <div style="font-size:12px;text-transform:uppercase;letter-spacing:1px;color:#aaa;border-bottom:2px solid #1a2744;padding-bottom:8px;margin-bottom:10px;">Entrega y pago</div>
      <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
        ${entregaRows}
        ${infoRow('Pago', esc(PAYMENT_LABELS[order.payment_method ?? ''] ?? order.payment_method ?? '—'))}
        ${infoRow('Estado pago', order.payment_status === 'pagado' ? '<span style="color:#15803d;">✅ Pagado</span>' : '<span style="color:#b45309;">⏳ Pendiente</span>')}
      </table>

      <div style="font-size:12px;text-transform:uppercase;letter-spacing:1px;color:#aaa;border-bottom:2px solid #1a2744;padding-bottom:8px;">Productos</div>
      <table style="width:100%;border-collapse:collapse;margin-bottom:16px;">
        <tbody>${itemRows}</tbody>
      </table>

      <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
        <tr><td style="padding:5px 0;color:#555;font-size:14px;">Subtotal</td><td style="padding:5px 0;text-align:right;color:#1a2744;font-size:14px;">${money(order.subtotal)}</td></tr>
        ${discount > 0 ? `<tr><td style="padding:5px 0;color:#555;font-size:14px;">Descuento</td><td style="padding:5px 0;text-align:right;color:#15803d;font-size:14px;">−${money(discount)}</td></tr>` : ''}
        <tr><td style="padding:5px 0;color:#555;font-size:14px;">Envío</td><td style="padding:5px 0;text-align:right;font-size:14px;color:${Number(order.shipping_cost) === 0 ? '#15803d' : '#1a2744'};">${Number(order.shipping_cost) === 0 ? 'Gratis' : money(order.shipping_cost)}</td></tr>
        <tr>
          <td style="padding:12px 0 0;border-top:2px solid #1a2744;font-weight:800;color:#1a2744;font-size:16px;">Total</td>
          <td style="padding:12px 0 0;border-top:2px solid #1a2744;text-align:right;font-weight:900;color:#c0392b;font-size:20px;">${money(order.total)}</td>
        </tr>
      </table>

      ${order.notes ? `
      <div style="padding:14px;background:#fffbeb;border:1px solid #fde68a;border-radius:10px;margin-bottom:24px;">
        <p style="margin:0 0 4px;font-size:12px;text-transform:uppercase;letter-spacing:1px;color:#b45309;">Notas del cliente</p>
        <p style="margin:0;color:#92400e;font-size:14px;line-height:1.5;">${esc(order.notes)}</p>
      </div>` : ''}

      <div style="text-align:center;margin-top:8px;">
        <a href="${STORE_URL}/admin/orders"
           style="display:inline-block;background:linear-gradient(135deg,#c0392b,#e74c3c);color:#fff;text-decoration:none;padding:14px 32px;border-radius:12px;font-weight:700;font-size:15px;">
          Ver pedido en el panel
        </a>
      </div>

    </div>

    <p style="text-align:center;color:#aaa;font-size:12px;margin:20px 0 0;">
      Aviso automático de AracnidaStore
    </p>
  </div>
</body></html>`
}

/**
 * Avisa al dueño que entró un pedido nuevo. Se dispara en los mismos dos
 * puntos que la notificación de Telegram (retiro al crearse, delivery al
 * confirmarse el pago), así que nunca se duplica.
 */
export async function sendAdminOrderNotification(order: Order): Promise<void> {
  if (!API_KEY) {
    console.warn('[Email] RESEND_API_KEY no configurada, no se avisa al admin')
    return
  }

  try {
    const resend = new Resend(API_KEY)
    const { error } = await resend.emails.send({
      from: FROM,
      to: ADMIN_EMAIL,
      replyTo: order.customer_email || undefined,
      subject: `🛒 Nuevo pedido #${order.id.slice(0, 8).toUpperCase()} — AracnidaStore — ${money(order.total)}`,
      html: buildAdminHtml(order),
    })
    if (error) console.error('[Email] Error avisando al admin:', error)
  } catch (err) {
    // Igual que el comprobante: un fallo de correo no puede tumbar la compra
    console.error('[Email] Excepción avisando al admin:', err)
  }
}

/* ────────────────────────────────────────────────────────────────────────
   Reserva anticipada
   ──────────────────────────────────────────────────────────────────────── */

/** Desglose de montos, el bloque más importante del correo de reserva. */
function reservationAmountsBlock(order: Order): string {
  return `
      <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
        <tr><td style="padding:6px 0;color:#555;">Precio normal</td><td style="padding:6px 0;text-align:right;color:#888;text-decoration:line-through;">${money(order.subtotal)}</td></tr>
        <tr><td style="padding:6px 0;color:#555;">Descuento por reservar (15%)</td><td style="padding:6px 0;text-align:right;color:#15803d;font-weight:600;">−${money(order.discount)}</td></tr>
        <tr>
          <td style="padding:10px 0;border-top:2px solid #1a2744;font-weight:800;color:#15803d;">Total pagado</td>
          <td style="padding:10px 0;border-top:2px solid #1a2744;text-align:right;font-weight:900;color:#15803d;font-size:19px;">${money(order.total)}</td>
        </tr>
      </table>`
}

function buildReservationHtml(order: Order): string {
  const shortId = order.id.slice(0, 8).toUpperCase()

  const itemRows = (order.items ?? [])
    .map(
      (i) => `
      <tr>
        <td style="padding:12px 0;border-bottom:1px solid #eee;">
          <div style="font-weight:600;color:#1a2744;">${esc(i.product_name)}</div>
          <div style="font-size:13px;color:#888;">Talla ${esc(i.size)} · Cantidad ${i.quantity}</div>
        </td>
      </tr>`
    )
    .join('')

  return `<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f5f4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:24px 16px;">

    <div style="background:linear-gradient(135deg,#1a2744,#0f1e3d);border-radius:16px 16px 0 0;padding:32px 28px;text-align:center;">
      <h1 style="margin:0;color:#fff;font-size:24px;font-weight:900;letter-spacing:-.5px;">
        Aracnida<span style="color:#e74c3c;">Store</span>
      </h1>
      <p style="margin:8px 0 0;color:rgba(255,255,255,.6);font-size:14px;">Reserva confirmada</p>
    </div>

    <div style="background:#fff;padding:28px;border-radius:0 0 16px 16px;">
      <p style="margin:0 0 4px;font-size:16px;color:#1a2744;">Hola <strong>${esc(order.customer_name)}</strong>,</p>
      <p style="margin:0 0 24px;color:#555;line-height:1.6;">
        ¡Tu reserva quedó confirmada! Recibimos tu pago y ya estamos gestionando tu producto.
      </p>

      <div style="display:inline-block;padding:8px 16px;background:#f5f5f4;border-radius:999px;margin-bottom:24px;">
        <span style="font-size:12px;color:#888;">Reserva</span>
        <strong style="font-family:monospace;color:#1a2744;margin-left:6px;">#${shortId}</strong>
      </div>

      <table style="width:100%;border-collapse:collapse;margin-bottom:8px;">
        <thead>
          <tr><th style="text-align:left;padding-bottom:8px;font-size:12px;text-transform:uppercase;letter-spacing:1px;color:#aaa;border-bottom:2px solid #1a2744;">Producto reservado</th></tr>
        </thead>
        <tbody>${itemRows}</tbody>
      </table>

      <div style="margin:20px 0;padding:14px 16px;background:#f4f7ff;border:1px solid #d9e2ff;border-radius:12px;">
        <p style="margin:0;font-size:13px;color:#555;">Lo necesitas para el</p>
        <p style="margin:2px 0 0;font-weight:700;color:#1a2744;font-size:16px;">${esc(order.needed_by ?? 'Por confirmar')}</p>
      </div>

      ${reservationAmountsBlock(order)}

      <div style="padding:16px;background:#fafafa;border-radius:12px;margin-bottom:8px;">
        <p style="margin:0 0 10px;font-size:12px;text-transform:uppercase;letter-spacing:1px;color:#aaa;">Qué sigue</p>
        <p style="margin:0 0 8px;color:#555;line-height:1.6;font-size:14px;">
          1. Gestionamos y recibimos tu producto.<br>
          2. Te avisamos apenas llegue.<br>
          3. Coordinas si lo quieres con <strong>envío a domicilio</strong> o <strong>retiro en ${PICKUP_PLACE}</strong>. Tu reserva ya está pagada por completo, así que no queda nada por pagar en ese momento.
        </p>
      </div>

      <div style="text-align:center;margin:28px 0 8px;">
        <a href="${STORE_URL}/reserva/${order.id}"
           style="display:inline-block;background:linear-gradient(135deg,#c0392b,#e74c3c);color:#fff;text-decoration:none;padding:14px 32px;border-radius:12px;font-weight:700;">
          Ver estado de mi reserva
        </a>
      </div>

      <p style="margin:24px 0 0;text-align:center;color:#888;font-size:13px;line-height:1.6;">
        ¿Dudas con tu reserva?<br>
        Escríbenos por <a href="https://wa.me/${WHATSAPP}?text=${encodeURIComponent(`Hola! Consulta sobre mi reserva #${shortId}`)}" style="color:#c0392b;font-weight:600;">WhatsApp</a>
      </p>
    </div>

    <p style="text-align:center;color:#aaa;font-size:12px;margin:20px 0 0;">
      AracnidaStore · Santiago, Chile<br>
      Este es un comprobante automático de tu reserva.
    </p>
  </div>
</body></html>`
}

/** Comprobante de la reserva al cliente, una vez confirmado el pago. */
export async function sendReservationReceipt(order: Order): Promise<void> {
  if (!API_KEY || !order.customer_email) return

  try {
    const resend = new Resend(API_KEY)
    const { error } = await resend.emails.send({
      from: FROM,
      to: order.customer_email,
      subject: `✅ Reserva confirmada #${order.id.slice(0, 8).toUpperCase()} — AracnidaStore`,
      html: buildReservationHtml(order),
    })
    if (error) console.error('[Email] Error enviando comprobante de reserva:', error)
  } catch (err) {
    console.error('[Email] Excepción enviando comprobante de reserva:', err)
  }
}

/** Aviso al dueño de que entró una reserva con el pago ya confirmado. */
export async function sendAdminReservationNotification(order: Order): Promise<void> {
  if (!API_KEY) return

  const shortId = order.id.slice(0, 8).toUpperCase()
  const items = (order.items ?? [])
    .map((i) => `${esc(i.product_name)} · Talla ${esc(i.size)} × ${i.quantity}`)
    .join('<br>')

  const html = `<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f5f4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:24px 16px;">
    <div style="background:linear-gradient(135deg,#1a2744,#0f1e3d);border-radius:16px 16px 0 0;padding:28px;text-align:center;">
      <h1 style="margin:0;color:#fff;font-size:22px;font-weight:900;">Aracnida<span style="color:#e74c3c;">Store</span></h1>
      <p style="margin:8px 0 0;color:rgba(255,255,255,.65);font-size:14px;">📅 Nueva reserva anticipada</p>
    </div>
    <div style="background:#fff;padding:28px;border-radius:0 0 16px 16px;">
      <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
        <tr>
          <td style="vertical-align:top;">
            <div style="font-size:12px;text-transform:uppercase;letter-spacing:1px;color:#aaa;">Reserva</div>
            <div style="font-family:monospace;font-size:20px;font-weight:800;color:#1a2744;">#${shortId}</div>
          </td>
          <td style="vertical-align:top;text-align:right;">
            <div style="font-size:12px;text-transform:uppercase;letter-spacing:1px;color:#aaa;">Total pagado</div>
            <div style="font-size:24px;font-weight:900;color:#15803d;">${money(order.total)}</div>
          </td>
        </tr>
      </table>

      <div style="font-size:12px;text-transform:uppercase;letter-spacing:1px;color:#aaa;border-bottom:2px solid #1a2744;padding-bottom:8px;margin-bottom:10px;">Cliente</div>
      <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
        ${infoRow('Nombre', esc(order.customer_name))}
        ${infoRow('Email', `<a href="mailto:${esc(order.customer_email)}" style="color:#c0392b;text-decoration:none;">${esc(order.customer_email)}</a>`)}
        ${order.customer_phone ? infoRow('Teléfono', `<a href="https://wa.me/${esc(String(order.customer_phone).replace(/\D/g, ''))}" style="color:#c0392b;text-decoration:none;">${esc(order.customer_phone)}</a>`) : ''}
        ${infoRow('Lo necesita para', `<strong>${esc(order.needed_by ?? '—')}</strong>`)}
        ${infoRow('Pagó con', order.payment_method === 'transferencia' ? 'Transferencia' : 'Mercado Pago')}
      </table>

      <div style="font-size:12px;text-transform:uppercase;letter-spacing:1px;color:#aaa;border-bottom:2px solid #1a2744;padding-bottom:8px;margin-bottom:10px;">Producto a conseguir</div>
      <p style="margin:0 0 24px;color:#1a2744;font-size:15px;font-weight:600;line-height:1.6;">${items || '—'}</p>

      ${reservationAmountsBlock(order)}

      <div style="text-align:center;margin-top:8px;">
        <a href="${STORE_URL}/admin/reservations"
           style="display:inline-block;background:linear-gradient(135deg,#c0392b,#e74c3c);color:#fff;text-decoration:none;padding:14px 32px;border-radius:12px;font-weight:700;font-size:15px;">
          Ver reservas en el panel
        </a>
      </div>
    </div>
    <p style="text-align:center;color:#aaa;font-size:12px;margin:20px 0 0;">Aviso automático de AracnidaStore</p>
  </div>
</body></html>`

  try {
    const resend = new Resend(API_KEY)
    const { error } = await resend.emails.send({
      from: FROM,
      to: ADMIN_EMAIL,
      replyTo: order.customer_email || undefined,
      subject: `📅 Nueva reserva #${shortId} — ${money(order.total)}`,
      html,
    })
    if (error) console.error('[Email] Error avisando reserva al admin:', error)
  } catch (err) {
    console.error('[Email] Excepción avisando reserva al admin:', err)
  }
}
