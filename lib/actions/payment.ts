'use server'

import { headers } from 'next/headers'
import { createAdminClient } from '@/lib/supabase/server'
import { getPreferenceClient, isMercadoPagoEnabled } from '@/lib/mercadopago'

/**
 * Detecta la URL base desde el host real de la petición. Así funciona con
 * cualquier dominio (vercel.app, .com o .cl) sin tener que cambiar el código.
 * Usa NEXT_PUBLIC_APP_URL solo como respaldo.
 */
async function getBaseUrl() {
  try {
    const h = await headers()
    const host = h.get('x-forwarded-host') || h.get('host')
    const proto = h.get('x-forwarded-proto') || 'https'
    if (host && !host.startsWith('localhost')) return `${proto}://${host}`
  } catch {}
  return (process.env.NEXT_PUBLIC_APP_URL || 'https://aracnida-store.vercel.app').replace(/\/$/, '')
}

/**
 * Crea una preferencia de pago de Mercado Pago Checkout Pro para un pedido ya creado.
 * Devuelve la URL (init_point) a la que se debe redirigir al cliente.
 */
export async function createMercadoPagoPreference(orderId: string) {
  if (!isMercadoPagoEnabled()) {
    return { error: 'El pago en línea no está disponible en este momento.' }
  }

  const supabase = await createAdminClient()

  const { data: order } = await supabase
    .from('orders')
    .select('*, items:order_items(*)')
    .eq('id', orderId)
    .single()

  if (!order) return { error: 'Pedido no encontrado' }

  const baseUrl = await getBaseUrl()

  const items =
    (order.items ?? []).map(
      (i: { product_name: string; size: string; quantity: number; unit_price: number }) => ({
        id: orderId,
        title: `${i.product_name}${i.size ? ` - Talla ${i.size}` : ''}`,
        quantity: i.quantity,
        unit_price: Number(i.unit_price),
        currency_id: 'CLP',
      })
    ) ?? []

  // El envío se agrega como un ítem adicional para que el total coincida
  if (Number(order.shipping_cost) > 0) {
    items.push({
      id: `${orderId}-shipping`,
      title: 'Envío',
      quantity: 1,
      unit_price: Number(order.shipping_cost),
      currency_id: 'CLP',
    })
  }

  try {
    const preference = await getPreferenceClient().create({
      body: {
        items,
        external_reference: orderId,
        payer: {
          name: order.customer_name,
          email: order.customer_email,
        },
        back_urls: {
          success: `${baseUrl}/order-success/${orderId}?pago=ok`,
          pending: `${baseUrl}/order-success/${orderId}?pago=pendiente`,
          failure: `${baseUrl}/order-success/${orderId}?pago=error`,
        },
        auto_return: 'approved',
        notification_url: `${baseUrl}/api/mercadopago/webhook`,
        statement_descriptor: 'ARACNIDASTORE',
        metadata: { order_id: orderId },
      },
    })

    await supabase
      .from('orders')
      .update({ mp_preference_id: preference.id })
      .eq('id', orderId)

    return { url: preference.init_point as string }
  } catch (err) {
    console.error('[MercadoPago] Error creando preferencia:', err)
    return { error: 'No se pudo iniciar el pago. Intenta nuevamente.' }
  }
}
