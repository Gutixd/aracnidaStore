/**
 * Cálculo puro del cupón, sin base de datos: lo usan tanto el checkout (en
 * el navegador, para la vista previa) como el servidor (el que manda).
 */

export type CouponType = 'percent' | 'fixed'

export function normalizeCode(code: string): string {
  return code.trim().toUpperCase().replace(/\s+/g, '')
}

/** Monto a descontar, en pesos enteros, nunca mayor que el subtotal. */
export function couponDiscount(coupon: { type: CouponType; value: number }, subtotal: number): number {
  const raw = coupon.type === 'percent'
    ? Math.round((subtotal * Number(coupon.value)) / 100)
    : Math.round(Number(coupon.value))
  return Math.max(0, Math.min(raw, subtotal))
}

export function describeCoupon(coupon: { type: CouponType; value: number }): string {
  return coupon.type === 'percent'
    ? `${Number(coupon.value)}% de descuento`
    : `$${Math.round(Number(coupon.value)).toLocaleString('es-CL')} de descuento`
}
