'use server'

import { createAdminClient } from '@/lib/supabase/server'
import { isAdmin } from '@/lib/auth/admin'
import { upsertMarketingContact } from '@/lib/actions/marketing'
import { checkRateLimit } from '@/lib/rate-limit'
import { reservationSchema, type ReservationFormData } from '@/lib/validations'
import { calcReservation, hasEnoughNotice, RESERVATION_MIN_DAYS } from '@/lib/reservations'
import { notifyNewReservation } from '@/lib/telegram'
import { sendPushToAdmins } from '@/lib/push'
import { sendReservationReceipt, sendAdminReservationNotification } from '@/lib/email'
import { revalidatePath } from 'next/cache'

/**
 * Crea una reserva anticipada. A diferencia de un pedido normal:
 *
 * - NO descuenta stock. Una reserva es un encargo de algo que todavía no
 *   tenemos ("el producto será gestionado y recibido por nosotros antes de
 *   coordinar la entrega"); descontar inventario que no existe descuadraría
 *   el stock real y bloquearía ventas inmediatas de lo que sí hay.
 * - No pide datos de entrega: se coordinan cuando el producto llega, por eso
 *   delivery_method queda en 'por_definir'.
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

  // La anticipación se valida en el servidor aunque el formulario ya la
  // valide: el cliente puede mandar cualquier fecha.
  if (!hasEnoughNotice(data.needed_by)) {
    return { error: `La reserva necesita al menos ${RESERVATION_MIN_DAYS} días de anticipación.` }
  }

  const supabase = await createAdminClient()

  const { data: variant } = await supabase
    .from('product_variants')
    .select('id, size, price, active, product_id')
    .eq('id', data.variant_id)
    .single()

  if (!variant || variant.active === false) {
    return { error: 'Ese producto no está disponible para reservar.' }
  }

  const { data: product } = await supabase
    .from('products')
    .select('id, name, color, image_url, active')
    .eq('id', variant.product_id)
    .single()

  if (!product || product.active === false) {
    return { error: 'Ese producto no está disponible para reservar.' }
  }

  const amounts = calcReservation(Number(variant.price), data.quantity)

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      is_reservation: true,
      customer_name: data.customer_name,
      customer_email: data.customer_email,
      customer_phone: data.customer_phone,
      subtotal: amounts.normal,
      discount: amounts.discount,
      shipping_cost: 0, // se define al coordinar la entrega
      total: amounts.final,
      // Se paga 100% al reservar: no queda saldo pendiente.
      deposit_amount: amounts.final,
      balance_due: 0,
      needed_by: data.needed_by,
      delivery_method: 'por_definir',
      delivery_address: '',
      delivery_commune: '',
      delivery_reference: '',
      payment_method: data.payment_method,
      status: 'pendiente',
      payment_status: 'pendiente',
      notes: data.notes ?? '',
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
    total_price: amounts.final,
  })

  if (itemError) {
    console.error('[Reserva] Error guardando el detalle:', itemError)
  }

  if (data.marketing_opt_in === true) {
    await upsertMarketingContact({
      email: data.customer_email,
      name: data.customer_name,
      phone: data.customer_phone,
      consent: true,
    })
  }

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
    '📅 Nueva reserva',
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

  revalidatePath('/admin/reservations')
  return { ok: true }
}
