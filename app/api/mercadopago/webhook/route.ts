import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getPaymentClient } from '@/lib/mercadopago'
import { notifyNewOrder } from '@/lib/telegram'

/**
 * Webhook de Mercado Pago. Recibe la notificación de un pago, consulta su estado
 * real en la API de MP y, si está aprobado, marca el pedido como pagado.
 */
export async function POST(req: NextRequest) {
  try {
    const url = new URL(req.url)
    let paymentId = url.searchParams.get('data.id') || url.searchParams.get('id')
    const type = url.searchParams.get('type') || url.searchParams.get('topic')

    // Algunas notificaciones llegan en el body
    if (!paymentId) {
      const body = await req.json().catch(() => null)
      if (body?.data?.id) paymentId = String(body.data.id)
      if (!paymentId && body?.type !== 'payment' && type !== 'payment') {
        return NextResponse.json({ ok: true })
      }
    }

    if (type && type !== 'payment') {
      return NextResponse.json({ ok: true })
    }
    if (!paymentId) return NextResponse.json({ ok: true })

    // Consultar el pago real en Mercado Pago
    const payment = await getPaymentClient().get({ id: paymentId })
    const orderId = payment.external_reference || payment.metadata?.order_id
    if (!orderId) return NextResponse.json({ ok: true })

    const supabase = await createAdminClient()
    const { data: order } = await supabase
      .from('orders')
      .select('*, items:order_items(*)')
      .eq('id', orderId)
      .single()

    if (!order) return NextResponse.json({ ok: true })

    const status = payment.status // approved | pending | rejected | ...
    const paymentStatusMap: Record<string, string> = {
      approved: 'pagado',
      pending: 'pendiente',
      in_process: 'pendiente',
      rejected: 'rechazado',
      cancelled: 'rechazado',
      refunded: 'reembolsado',
    }
    const newPaymentStatus = paymentStatusMap[status ?? ''] ?? 'pendiente'

    const alreadyPaid = order.payment_status === 'pagado'

    await supabase
      .from('orders')
      .update({
        payment_status: newPaymentStatus,
        payment_id: String(paymentId),
        payment_method: payment.payment_method_id ?? null,
        // Si el pago se aprueba y el pedido seguía pendiente, lo confirmamos
        status: status === 'approved' && order.status === 'pendiente' ? 'confirmado' : order.status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId)

    if (status === 'approved' && !alreadyPaid) {
      // Re-fetch con items actualizados por si acaso
      const { data: fullOrder } = await supabase
        .from('orders')
        .select('*, items:order_items(*)')
        .eq('id', orderId)
        .single()
      if (fullOrder) await notifyNewOrder(fullOrder)
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[MercadoPago Webhook] Error:', err)
    // Respondemos 200 para que MP no reintente en bucle por errores nuestros
    return NextResponse.json({ ok: true })
  }
}

// MP a veces hace un GET de verificación
export async function GET() {
  return NextResponse.json({ ok: true })
}
