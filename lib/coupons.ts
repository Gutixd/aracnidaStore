import { createAdminClient } from '@/lib/supabase/server'
import { couponDiscount, normalizeCode, type CouponType } from '@/lib/coupon-math'

export { couponDiscount, normalizeCode, describeCoupon } from '@/lib/coupon-math'
export type { CouponType } from '@/lib/coupon-math'

/**
 * Cupones de descuento. Un solo lugar para la regla, que usan la vista
 * previa del checkout y createOrder (el que manda): el descuento siempre se
 * recalcula en el servidor, nunca se confía en un monto del navegador.
 *
 * El descuento aplica sobre el SUBTOTAL de productos, no sobre el envío.
 * Un uso cuenta mientras el pedido no esté cancelado: si un checkout se
 * abandona y expira, el cupón queda libre otra vez.
 */

export interface Coupon {
  id: string
  code: string
  type: CouponType
  value: number
  min_subtotal: number
  max_uses: number | null
  once_per_customer: boolean
  starts_at: string | null
  expires_at: string | null
  active: boolean
  note: string
  created_at: string
}

type CouponCheck =
  | { ok: true; coupon: Coupon; discount: number }
  | { ok: false; error: string }

/**
 * Valida un código contra el subtotal y (si se conoce) el correo del
 * cliente. Los mensajes están pensados para mostrarse tal cual al cliente.
 */
export async function checkCoupon(
  rawCode: string,
  subtotal: number,
  email?: string
): Promise<CouponCheck> {
  const code = normalizeCode(rawCode)
  if (!code) return { ok: false, error: 'Escribe un código' }

  const supabase = await createAdminClient()
  const { data: coupon } = await supabase.from('coupons').select('*').eq('code', code).maybeSingle()

  // Mismo mensaje para "no existe" y "desactivado": no se revela qué códigos existen.
  if (!coupon || !coupon.active) return { ok: false, error: 'Ese código no es válido' }

  const now = Date.now()
  if (coupon.starts_at && new Date(coupon.starts_at).getTime() > now) {
    return { ok: false, error: 'Este cupón todavía no está vigente' }
  }
  if (coupon.expires_at && new Date(coupon.expires_at).getTime() < now) {
    return { ok: false, error: 'Este cupón ya expiró' }
  }
  if (subtotal < Number(coupon.min_subtotal)) {
    return {
      ok: false,
      error: `Este cupón es para compras desde $${Math.round(Number(coupon.min_subtotal)).toLocaleString('es-CL')}`,
    }
  }

  if (coupon.max_uses) {
    const { count } = await supabase
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .eq('coupon_code', code)
      .neq('status', 'cancelado')
    if ((count ?? 0) >= coupon.max_uses) return { ok: false, error: 'Este cupón ya alcanzó su límite de usos' }
  }

  if (coupon.once_per_customer && email) {
    // Se compara en minúsculas acá: pedidos antiguos guardaron el correo
    // tal como se escribió ("Juan@Gmail.com").
    const { data: usos } = await supabase
      .from('orders')
      .select('customer_email')
      .eq('coupon_code', code)
      .neq('status', 'cancelado')
    const mine = email.trim().toLowerCase()
    if ((usos ?? []).some((u) => (u.customer_email ?? '').trim().toLowerCase() === mine)) {
      return { ok: false, error: 'Ya usaste este cupón en un pedido anterior' }
    }
  }

  const discount = couponDiscount(coupon, subtotal)
  if (discount <= 0) return { ok: false, error: 'Este cupón no aplica a tu compra' }
  return { ok: true, coupon: coupon as Coupon, discount }
}
