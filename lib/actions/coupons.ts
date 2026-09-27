'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/server'
import { isAdmin } from '@/lib/auth/admin'
import { checkRateLimit } from '@/lib/rate-limit'
import { checkCoupon, normalizeCode, describeCoupon } from '@/lib/coupons'

/**
 * Vista previa del cupón en el checkout. Solo informa: el descuento real lo
 * recalcula createOrder al confirmar. Con límite de intentos para que no
 * sirva para adivinar códigos por fuerza bruta.
 */
export async function previewCoupon(code: string, subtotal: number, email?: string) {
  const rl = await checkRateLimit('coupon-preview', { max: 15, windowMinutes: 10 })
  if (!rl.allowed) return { error: 'Demasiados intentos. Espera unos minutos.' }
  if (!Number.isFinite(subtotal) || subtotal <= 0) return { error: 'Tu carrito está vacío' }

  const res = await checkCoupon(code, subtotal, email)
  if (!res.ok) return { error: res.error }
  return {
    code: res.coupon.code,
    type: res.coupon.type,
    value: Number(res.coupon.value),
    minSubtotal: Number(res.coupon.min_subtotal),
    discount: res.discount,
    label: describeCoupon(res.coupon),
  }
}

export interface CouponInput {
  code: string
  type: 'percent' | 'fixed'
  value: number
  min_subtotal?: number
  max_uses?: number | null
  once_per_customer?: boolean
  starts_at?: string | null
  expires_at?: string | null
  note?: string
}

export async function createCoupon(input: CouponInput) {
  if (!(await isAdmin())) return { error: 'No autorizado' }

  const code = normalizeCode(input.code)
  if (!/^[A-Z0-9_-]{3,30}$/.test(code)) {
    return { error: 'El código debe tener de 3 a 30 caracteres: letras, números, guion o guion bajo' }
  }
  const value = Number(input.value)
  if (!(value > 0)) return { error: 'El valor del descuento debe ser mayor a 0' }
  if (input.type === 'percent' && value > 100) return { error: 'El porcentaje no puede superar 100%' }
  if (input.type === 'fixed' && !Number.isInteger(value)) return { error: 'El monto debe ser en pesos enteros' }

  const maxUses = input.max_uses ? Number(input.max_uses) : null
  if (maxUses !== null && (!Number.isInteger(maxUses) || maxUses < 1)) return { error: 'El límite de usos debe ser un número entero' }

  if (input.starts_at && input.expires_at && new Date(input.expires_at) <= new Date(input.starts_at)) {
    return { error: 'La fecha de término debe ser posterior a la de inicio' }
  }

  const supabase = await createAdminClient()
  const { error } = await supabase.from('coupons').insert({
    code,
    type: input.type,
    value,
    min_subtotal: Math.max(0, Number(input.min_subtotal) || 0),
    max_uses: maxUses,
    once_per_customer: input.once_per_customer === true,
    starts_at: input.starts_at || null,
    expires_at: input.expires_at || null,
    note: (input.note ?? '').slice(0, 200),
  })

  if (error) {
    if (error.code === '23505') return { error: `Ya existe un cupón con el código ${code}` }
    console.error('[Cupones] Error creando cupón:', error)
    return { error: 'No se pudo crear el cupón' }
  }
  revalidatePath('/admin/coupons')
  return { ok: true }
}

export async function setCouponActive(id: string, active: boolean) {
  if (!(await isAdmin())) return { error: 'No autorizado' }
  const supabase = await createAdminClient()
  const { error } = await supabase.from('coupons').update({ active }).eq('id', id)
  if (error) return { error: 'No se pudo actualizar el cupón' }
  revalidatePath('/admin/coupons')
  return { ok: true }
}

/**
 * Solo se puede borrar un cupón que nunca se usó. Si ya tiene pedidos, se
 * desactiva: borrarlo dejaría pedidos apuntando a un código inexistente.
 */
export async function deleteCoupon(id: string) {
  if (!(await isAdmin())) return { error: 'No autorizado' }
  const supabase = await createAdminClient()
  const { data: coupon } = await supabase.from('coupons').select('code').eq('id', id).single()
  if (!coupon) return { error: 'Cupón no encontrado' }

  const { count } = await supabase
    .from('orders')
    .select('id', { count: 'exact', head: true })
    .eq('coupon_code', coupon.code)
  if ((count ?? 0) > 0) return { error: 'Este cupón ya se usó en pedidos: desactívalo en vez de borrarlo' }

  const { error } = await supabase.from('coupons').delete().eq('id', id)
  if (error) return { error: 'No se pudo borrar el cupón' }
  revalidatePath('/admin/coupons')
  return { ok: true }
}
