'use client'

import { useCart } from '@/store/cart'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { checkoutSchema, CheckoutFormData } from '@/lib/validations'
import { createOrder } from '@/lib/actions/orders'
import { createMercadoPagoPreference } from '@/lib/actions/payment'
import { formatPrice } from '@/lib/utils'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ShoppingBag, Loader2, MapPin, ChevronDown } from 'lucide-react'

const SHIPPING_COST = 3000
const FREE_SHIPPING_THRESHOLD = 50000

const REGIONES_CHILE = [
  'Región de Arica y Parinacota',
  'Región de Tarapacá',
  'Región de Antofagasta',
  'Región de Atacama',
  'Región de Coquimbo',
  'Región de Valparaíso',
  'Región Metropolitana de Santiago',
  'Región del Libertador General Bernardo O\'Higgins',
  'Región del Maule',
  'Región del Ñuble',
  'Región del Biobío',
  'Región de La Araucanía',
  'Región de Los Ríos',
  'Región de Los Lagos',
  'Región de Aysén del General Carlos Ibáñez del Campo',
  'Región de Magallanes y de la Antártica Chilena',
]

export default function CheckoutPage() {
  const { items, getTotalPrice, clearCart } = useCart()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const subtotal = getTotalPrice()
  const shippingCost = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_COST
  const total = subtotal + shippingCost

  const { register, handleSubmit, formState: { errors } } = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: { delivery_method: 'delivery' },
  })

  if (items.length === 0) {
    return (
      <div style={{ background: 'var(--gray-50)', minHeight: '100vh' }} className="flex items-center justify-center px-4">
        <div className="text-center">
          <ShoppingBag size={48} className="mx-auto mb-4" style={{ color: 'var(--gray-200)' }} />
          <h1 className="text-2xl font-black mb-4" style={{ color: 'var(--text)' }}>No hay productos en el carrito</h1>
          <Link href="/products" className="btn-primary px-8 py-4">Ver catálogo</Link>
        </div>
      </div>
    )
  }

  async function onSubmit(data: CheckoutFormData) {
    setLoading(true)
    setError(null)
    try {
      const result = await createOrder(data, items, shippingCost)
      if (result.error) {
        setError(result.error)
        setLoading(false)
        return
      }
      clearCart()

      const payment = await createMercadoPagoPreference(result.orderId!)
      if (payment.url) {
        window.location.href = payment.url
        return
      }

      router.push(`/order-success/${result.orderId}`)
    } catch {
      setError('Error inesperado. Por favor intenta nuevamente.')
      setLoading(false)
    }
  }

  const labelClass = "block text-sm font-semibold mb-1.5"
  const labelStyle = { color: 'var(--gray-600)' }

  return (
    <div style={{ background: 'var(--gray-50)', minHeight: '100vh' }}>
      <div className="max-w-5xl mx-auto pt-28 pb-24 px-4 sm:px-6 lg:px-8">
        <div className="mb-10">
          <h1 className="text-3xl font-black" style={{ color: 'var(--text)' }}>Finalizar compra</h1>
          <p className="mt-1" style={{ color: 'var(--gray-600)' }}>Completa tus datos para realizar el pedido</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            {/* Form */}
            <div className="lg:col-span-3 space-y-6">
              {/* Contacto */}
              <div className="card p-6">
                <h2 className="text-lg font-bold mb-5" style={{ color: 'var(--text)' }}>Datos de contacto</h2>
                <div className="space-y-4">
                  <div>
                    <label className={labelClass} style={labelStyle}>Nombre completo *</label>
                    <input {...register('customer_name')} placeholder="Tu nombre completo" className="input-field" autoComplete="name" />
                    {errors.customer_name && <p className="text-xs mt-1" style={{ color: 'var(--red)' }}>{errors.customer_name.message}</p>}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass} style={labelStyle}>Email *</label>
                      <input {...register('customer_email')} type="email" placeholder="tu@email.com" className="input-field" autoComplete="email" />
                      {errors.customer_email && <p className="text-xs mt-1" style={{ color: 'var(--red)' }}>{errors.customer_email.message}</p>}
                    </div>
                    <div>
                      <label className={labelClass} style={labelStyle}>Teléfono *</label>
                      <input {...register('customer_phone')} type="tel" placeholder="+56 9 1234 5678" className="input-field" autoComplete="tel" />
                      {errors.customer_phone && <p className="text-xs mt-1" style={{ color: 'var(--red)' }}>{errors.customer_phone.message}</p>}
                    </div>
                  </div>
                </div>
              </div>

              {/* Entrega */}
              <div className="card p-6">
                <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--text)' }}>Dirección de entrega</h2>
                <div className="flex items-center gap-2 mb-5 text-sm" style={{ color: 'var(--gray-600)' }}>
                  <MapPin size={14} style={{ color: 'var(--red)' }} />
                  Envío a domicilio · {shippingCost === 0 ? 'Gratis' : formatPrice(SHIPPING_COST)} · Todo Chile
                </div>

                <div className="space-y-4">
                  <div>
                    <label className={labelClass} style={labelStyle}>Dirección *</label>
                    <input {...register('delivery_address')} placeholder="Calle, número, depto/casa" className="input-field" autoComplete="street-address" />
                    {errors.delivery_address && <p className="text-xs mt-1" style={{ color: 'var(--red)' }}>{errors.delivery_address.message}</p>}
                  </div>

                  <div>
                    <label className={labelClass} style={labelStyle}>Región *</label>
                    <div className="relative">
                      <select {...register('delivery_region')} className="input-field appearance-none pr-10" defaultValue="">
                        <option value="" disabled>Selecciona tu región</option>
                        {REGIONES_CHILE.map((r) => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </select>
                      <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--gray-400)' }} />
                    </div>
                    {errors.delivery_region && <p className="text-xs mt-1" style={{ color: 'var(--red)' }}>{errors.delivery_region.message}</p>}
                  </div>

                  <div>
                    <label className={labelClass} style={labelStyle}>Comuna *</label>
                    <input {...register('delivery_commune')} placeholder="Ej: Maipú, Providencia, Viña del Mar..." className="input-field" />
                    {errors.delivery_commune && <p className="text-xs mt-1" style={{ color: 'var(--red)' }}>{errors.delivery_commune.message}</p>}
                  </div>

                  <div>
                    <label className={labelClass} style={labelStyle}>Referencia de entrega</label>
                    <input {...register('delivery_reference')} placeholder="Casa azul, edificio frente al banco..." className="input-field" />
                  </div>
                </div>
              </div>

              {/* Notas */}
              <div className="card p-6">
                <h2 className="text-lg font-bold mb-5" style={{ color: 'var(--text)' }}>Notas del pedido</h2>
                <textarea {...register('notes')} placeholder="Instrucciones especiales, etc." rows={3} className="input-field resize-none" />
              </div>

              <p className="text-xs" style={{ color: 'var(--gray-400)' }}>
                Al realizar tu compra aceptas nuestros{' '}
                <Link href="/terminos" className="underline hover:opacity-75">Términos y Condiciones</Link>
                {' '}y{' '}
                <Link href="/privacidad" className="underline hover:opacity-75">Política de Privacidad</Link>.
              </p>
            </div>

            {/* Resumen */}
            <div className="lg:col-span-2">
              <div className="card p-6 sticky top-24">
                <h2 className="text-lg font-bold mb-5" style={{ color: 'var(--text)' }}>Tu pedido</h2>
                <div className="space-y-3 mb-5">
                  {items.map(({ product, variant, quantity }) => (
                    <div key={variant.id} className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg overflow-hidden relative shrink-0" style={{ background: 'var(--gray-50)' }}>
                        {product.image_url && <Image src={product.image_url} alt={product.name} fill className="object-cover" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm truncate" style={{ color: 'var(--text)' }}>{product.name}</p>
                        <p className="text-xs" style={{ color: 'var(--gray-400)' }}>Talla {variant.size} · x{quantity}</p>
                      </div>
                      <span className="text-sm font-bold shrink-0 tabular-nums" style={{ color: 'var(--text)' }}>
                        {formatPrice(variant.price * quantity)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="pt-4 space-y-2 mb-6" style={{ borderTop: '1px solid var(--gray-100)' }}>
                  <div className="flex justify-between text-sm">
                    <span style={{ color: 'var(--gray-600)' }}>Subtotal</span>
                    <span className="font-semibold tabular-nums" style={{ color: 'var(--text)' }}>{formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span style={{ color: 'var(--gray-600)' }}>Envío</span>
                    <span className="font-semibold tabular-nums" style={{ color: shippingCost === 0 ? '#15803d' : 'var(--text)' }}>
                      {shippingCost === 0 ? 'Gratis' : formatPrice(shippingCost)}
                    </span>
                  </div>
                  <div className="flex justify-between pt-3 mt-2" style={{ borderTop: '1px solid var(--gray-100)' }}>
                    <span className="font-bold" style={{ color: 'var(--text)' }}>Total</span>
                    <span className="font-black text-xl tabular-nums" style={{ color: 'var(--red)' }}>{formatPrice(total)}</span>
                  </div>
                </div>

                {error && (
                  <div className="rounded-xl p-3 mb-4 text-sm" style={{ background: 'rgba(192,57,43,.1)', border: '1px solid rgba(192,57,43,.3)', color: 'var(--red)' }}>
                    {error}
                  </div>
                )}

                <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-4">
                  {loading ? <><Loader2 size={18} className="animate-spin" />Redirigiendo al pago...</> : 'Pagar con Mercado Pago'}
                </button>
                <p className="text-xs text-center mt-4" style={{ color: 'var(--gray-400)' }}>
                  Pago seguro · tarjetas, débito y transferencia
                </p>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
