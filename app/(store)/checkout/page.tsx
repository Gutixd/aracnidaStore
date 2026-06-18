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
import { ShoppingBag, Loader2, MapPin, ChevronDown, Truck, Calendar, Banknote, Copy, Check, Clock, AlertCircle } from 'lucide-react'

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
  "Región del Libertador General Bernardo O'Higgins",
  'Región del Maule',
  'Región del Ñuble',
  'Región del Biobío',
  'Región de La Araucanía',
  'Región de Los Ríos',
  'Región de Los Lagos',
  'Región de Aysén del General Carlos Ibáñez del Campo',
  'Región de Magallanes y de la Antártica Chilena',
]

const TRANSFER_INFO = {
  banco: 'Banco Estado',
  tipo: 'Cuenta RUT',
  nombre: 'Diego Gutierrez',
  rut: '21.481.177-4',
}

const PICKUP_SLOTS = [
  {
    id: 'martes' as const,
    label: 'Martes',
    hours: '13:00 – 16:00',
    desc: 'Confirmación con 24 hrs de anticipación',
    times: ['13:00', '13:30', '14:00', '14:30', '15:00', '15:30'],
  },
  {
    id: 'sabado' as const,
    label: 'Sábado',
    hours: '11:00 – 15:00',
    desc: 'Confirmación con 24 hrs de anticipación',
    times: ['11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30'],
  },
]

export default function CheckoutPage() {
  const { items, getTotalPrice, clearCart } = useCart()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState<string | null>(null)
  const router = useRouter()

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: { delivery_method: 'delivery' },
  })

  const deliveryMethod = watch('delivery_method')
  const paymentMethod = watch('payment_method')
  const pickupSlot = watch('pickup_slot')
  const pickupTime = watch('pickup_time')

  // Registrar pickup_time para que react-hook-form lo incluya en la data
  register('pickup_time')

  const subtotal = getTotalPrice()
  const isRetiro = deliveryMethod === 'retiro'
  const shippingCost = isRetiro ? 0 : (subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_COST)
  const total = subtotal + shippingCost

  function copyToClipboard(text: string, key: string) {
    navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(null), 2000)
  }

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

      if (!isRetiro) {
        const payment = await createMercadoPagoPreference(result.orderId!)
        if (payment.url) {
          window.location.href = payment.url
          return
        }
      }

      router.push(`/order-success/${result.orderId}`)
    } catch {
      setError('Error inesperado. Por favor intenta nuevamente.')
      setLoading(false)
    }
  }

  const labelClass = 'block text-sm font-semibold mb-1.5'
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

              {/* Datos de contacto */}
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
                      <label className={labelClass} style={labelStyle}>Teléfono / WhatsApp *</label>
                      <input {...register('customer_phone')} type="tel" placeholder="+56 9 1234 5678" className="input-field" autoComplete="tel" />
                      {errors.customer_phone && <p className="text-xs mt-1" style={{ color: 'var(--red)' }}>{errors.customer_phone.message}</p>}
                    </div>
                  </div>
                </div>
              </div>

              {/* Método de entrega */}
              <div className="card p-6">
                <h2 className="text-lg font-bold mb-5" style={{ color: 'var(--text)' }}>Método de entrega</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Envío a domicilio */}
                  <label
                    className="relative flex flex-col gap-3 p-4 rounded-2xl cursor-pointer transition-all"
                    style={{
                      border: deliveryMethod === 'delivery' ? '2px solid var(--red)' : '2px solid var(--gray-200)',
                      background: deliveryMethod === 'delivery' ? 'rgba(192,57,43,.04)' : '#fff',
                    }}
                  >
                    <input
                      type="radio"
                      value="delivery"
                      {...register('delivery_method')}
                      className="sr-only"
                    />
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: deliveryMethod === 'delivery' ? 'rgba(192,57,43,.1)' : 'var(--gray-50)', color: deliveryMethod === 'delivery' ? 'var(--red)' : 'var(--gray-400)' }}>
                        <Truck size={18} />
                      </div>
                      <div>
                        <p className="font-bold text-sm" style={{ color: 'var(--text)' }}>Envío a domicilio</p>
                        <p className="text-xs" style={{ color: 'var(--gray-400)' }}>
                          {subtotal >= FREE_SHIPPING_THRESHOLD ? 'Gratis' : formatPrice(SHIPPING_COST)} · Todo Chile
                        </p>
                      </div>
                    </div>
                  </label>

                  {/* Retiro en Plaza Maipú */}
                  <label
                    className="relative flex flex-col gap-3 p-4 rounded-2xl cursor-pointer transition-all"
                    style={{
                      border: deliveryMethod === 'retiro' ? '2px solid var(--red)' : '2px solid var(--gray-200)',
                      background: deliveryMethod === 'retiro' ? 'rgba(192,57,43,.04)' : '#fff',
                    }}
                  >
                    <input
                      type="radio"
                      value="retiro"
                      {...register('delivery_method')}
                      className="sr-only"
                    />
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: deliveryMethod === 'retiro' ? 'rgba(192,57,43,.1)' : 'var(--gray-50)', color: deliveryMethod === 'retiro' ? 'var(--red)' : 'var(--gray-400)' }}>
                        <MapPin size={18} />
                      </div>
                      <div>
                        <p className="font-bold text-sm" style={{ color: 'var(--text)' }}>Retiro en Maipú</p>
                        <p className="text-xs" style={{ color: 'var(--gray-400)' }}>Gratis · Plaza de Maipú</p>
                      </div>
                    </div>
                  </label>
                </div>

                {/* Panel envío a domicilio */}
                {deliveryMethod === 'delivery' && (
                  <div className="mt-5 space-y-4">
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
                )}

                {/* Panel retiro en Maipú */}
                {deliveryMethod === 'retiro' && (
                  <div className="mt-5 space-y-5">
                    {/* Aviso 24 hrs */}
                    <div className="flex items-start gap-3 p-3.5 rounded-xl"
                      style={{ background: 'rgba(180,83,9,.06)', border: '1px solid rgba(180,83,9,.2)' }}>
                      <AlertCircle size={16} className="flex-shrink-0 mt-0.5" style={{ color: '#b45309' }} />
                      <p className="text-sm" style={{ color: '#92400e' }}>
                        <strong>Confirmación obligatoria:</strong> debes coordinar el retiro con al menos <strong>24 horas de anticipación</strong> escribiendo por Instagram o WhatsApp.
                      </p>
                    </div>

                    {/* Horarios disponibles */}
                    <div>
                      <label className="block text-sm font-semibold mb-3" style={{ color: 'var(--gray-600)' }}>
                        Elige el día de retiro *
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {PICKUP_SLOTS.map((slot) => (
                          <label
                            key={slot.id}
                            className="flex items-start gap-3 p-4 rounded-2xl cursor-pointer transition-all"
                            style={{
                              border: pickupSlot === slot.id ? '2px solid var(--red)' : '2px solid var(--gray-200)',
                              background: pickupSlot === slot.id ? 'rgba(192,57,43,.04)' : '#fff',
                            }}
                          >
                            <input
                              type="radio"
                              value={slot.id}
                              {...register('pickup_slot')}
                              onChange={() => {
                                setValue('pickup_slot', slot.id)
                                setValue('pickup_time', '')
                              }}
                              className="sr-only"
                            />
                            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                              style={{ background: pickupSlot === slot.id ? 'rgba(192,57,43,.1)' : 'var(--gray-50)', color: pickupSlot === slot.id ? 'var(--red)' : 'var(--gray-400)' }}>
                              <Calendar size={17} />
                            </div>
                            <div>
                              <p className="font-bold text-sm" style={{ color: 'var(--text)' }}>{slot.label}</p>
                              <p className="text-xs font-semibold" style={{ color: pickupSlot === slot.id ? 'var(--red)' : 'var(--gray-600)' }}>
                                <Clock size={11} className="inline mr-1" />{slot.hours}
                              </p>
                              <p className="text-xs mt-0.5" style={{ color: 'var(--gray-400)' }}>{slot.desc}</p>
                            </div>
                          </label>
                        ))}
                      </div>
                      {errors.pickup_slot && <p className="text-xs mt-1" style={{ color: 'var(--red)' }}>{errors.pickup_slot.message}</p>}

                      {/* Selector de hora — aparece cuando se elige día */}
                      {pickupSlot && (() => {
                        const slotData = PICKUP_SLOTS.find((s) => s.id === pickupSlot)!
                        return (
                          <div className="mt-4">
                            <label className="block text-sm font-semibold mb-3" style={{ color: 'var(--gray-600)' }}>
                              Hora de retiro el {slotData.label} *
                            </label>
                            <div className="flex flex-wrap gap-2">
                              {slotData.times.map((t) => (
                                <button
                                  key={t}
                                  type="button"
                                  onClick={() => setValue('pickup_time', t, { shouldValidate: true })}
                                  className="px-4 py-2 rounded-xl text-sm font-bold transition-all"
                                  style={
                                    pickupTime === t
                                      ? { background: 'var(--red)', color: '#fff', border: '2px solid var(--red)', boxShadow: '0 4px 14px rgba(192,57,43,.3)' }
                                      : { background: '#fff', color: 'var(--text)', border: '2px solid var(--gray-200)' }
                                  }
                                >
                                  <Clock size={12} className="inline mr-1.5" />{t}
                                </button>
                              ))}
                            </div>
                            {errors.pickup_time && <p className="text-xs mt-1" style={{ color: 'var(--red)' }}>{errors.pickup_time.message}</p>}
                            {pickupTime && (
                              <p className="text-xs mt-2 font-semibold" style={{ color: '#15803d' }}>
                                ✓ Retiro el {slotData.label} a las {pickupTime} · Coordinar con 24 hrs de anticipación
                              </p>
                            )}
                          </div>
                        )
                      })()}
                    </div>

                    {/* Método de pago */}
                    <div>
                      <label className="block text-sm font-semibold mb-3" style={{ color: 'var(--gray-600)' }}>
                        Método de pago *
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {[
                          { id: 'transferencia' as const, label: 'Transferencia bancaria', sub: 'Pago previo por transferencia' },
                          { id: 'efectivo' as const, label: 'Efectivo', sub: 'Pago en el momento del retiro' },
                        ].map((opt) => (
                          <label
                            key={opt.id}
                            className="flex items-start gap-3 p-4 rounded-2xl cursor-pointer transition-all"
                            style={{
                              border: paymentMethod === opt.id ? '2px solid var(--red)' : '2px solid var(--gray-200)',
                              background: paymentMethod === opt.id ? 'rgba(192,57,43,.04)' : '#fff',
                            }}
                          >
                            <input
                              type="radio"
                              value={opt.id}
                              {...register('payment_method')}
                              className="sr-only"
                            />
                            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                              style={{ background: paymentMethod === opt.id ? 'rgba(192,57,43,.1)' : 'var(--gray-50)', color: paymentMethod === opt.id ? 'var(--red)' : 'var(--gray-400)' }}>
                              <Banknote size={17} />
                            </div>
                            <div>
                              <p className="font-bold text-sm" style={{ color: 'var(--text)' }}>{opt.label}</p>
                              <p className="text-xs" style={{ color: 'var(--gray-400)' }}>{opt.sub}</p>
                            </div>
                          </label>
                        ))}
                      </div>
                      {errors.payment_method && <p className="text-xs mt-1" style={{ color: 'var(--red)' }}>{errors.payment_method.message}</p>}
                    </div>

                    {/* Datos de transferencia */}
                    {paymentMethod === 'transferencia' && (
                      <div className="rounded-2xl p-5 space-y-3"
                        style={{ background: 'rgba(192,57,43,.04)', border: '1px solid rgba(192,57,43,.18)' }}>
                        <p className="text-sm font-bold mb-4" style={{ color: 'var(--text)' }}>Datos para la transferencia</p>
                        {[
                          { label: 'Banco', value: TRANSFER_INFO.banco },
                          { label: 'Tipo de cuenta', value: TRANSFER_INFO.tipo },
                          { label: 'Nombre', value: TRANSFER_INFO.nombre },
                          { label: 'RUT', value: TRANSFER_INFO.rut },
                        ].map(({ label, value }) => (
                          <div key={label} className="flex items-center justify-between gap-3">
                            <div>
                              <p className="text-xs" style={{ color: 'var(--gray-400)' }}>{label}</p>
                              <p className="text-sm font-bold" style={{ color: 'var(--text)' }}>{value}</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(value, label)}
                              className="w-8 h-8 rounded-lg flex items-center justify-center transition-all flex-shrink-0"
                              style={{ background: 'rgba(192,57,43,.1)', color: 'var(--red)' }}
                              aria-label={`Copiar ${label}`}
                            >
                              {copied === label ? <Check size={14} /> : <Copy size={14} />}
                            </button>
                          </div>
                        ))}
                        <div className="pt-3 mt-1" style={{ borderTop: '1px solid rgba(192,57,43,.15)' }}>
                          <p className="text-xs" style={{ color: 'var(--gray-400)' }}>
                            Envía el comprobante por Instagram o WhatsApp al confirmar el retiro.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Notas */}
              <div className="card p-6">
                <h2 className="text-lg font-bold mb-5" style={{ color: 'var(--text)' }}>Notas del pedido</h2>
                <textarea {...register('notes')} placeholder="Instrucciones especiales, alergias, talla exacta, etc." rows={3} className="input-field resize-none" />
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
                        {product.image_url && <Image src={product.image_url} alt={product.name} fill className="object-cover" sizes="48px" />}
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
                    <span style={{ color: 'var(--gray-600)' }}>{isRetiro ? 'Retiro' : 'Envío'}</span>
                    <span className="font-semibold tabular-nums" style={{ color: shippingCost === 0 ? '#15803d' : 'var(--text)' }}>
                      {shippingCost === 0 ? 'Gratis' : formatPrice(shippingCost)}
                    </span>
                  </div>
                  <div className="flex justify-between pt-3 mt-2" style={{ borderTop: '1px solid var(--gray-100)' }}>
                    <span className="font-bold" style={{ color: 'var(--text)' }}>Total</span>
                    <span className="font-black text-xl tabular-nums" style={{ color: 'var(--red)' }}>{formatPrice(total)}</span>
                  </div>
                </div>

                {/* Info retiro */}
                {isRetiro && (
                  <div className="mb-5 p-3.5 rounded-xl text-sm"
                    style={{ background: 'rgba(192,57,43,.05)', border: '1px solid rgba(192,57,43,.15)' }}>
                    <p className="font-bold mb-1" style={{ color: 'var(--text)' }}>Retiro en Plaza de Maipú</p>
                    <p style={{ color: 'var(--gray-600)' }}>
                      {pickupSlot === 'martes' ? 'Martes' : pickupSlot === 'sabado' ? 'Sábado' : 'Elige el día'}
                      {pickupTime ? ` · ${pickupTime} hrs` : ' · Elige la hora'}
                    </p>
                  </div>
                )}

                {error && (
                  <div className="rounded-xl p-3 mb-4 text-sm" style={{ background: 'rgba(192,57,43,.1)', border: '1px solid rgba(192,57,43,.3)', color: 'var(--red)' }}>
                    {error}
                  </div>
                )}

                <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-4">
                  {loading
                    ? <><Loader2 size={18} className="animate-spin" />Procesando...</>
                    : isRetiro
                      ? 'Confirmar pedido'
                      : 'Pagar con Mercado Pago'
                  }
                </button>
                <p className="text-xs text-center mt-4" style={{ color: 'var(--gray-400)' }}>
                  {isRetiro
                    ? 'Tu pedido quedará pendiente hasta coordinar el retiro'
                    : 'Pago seguro · tarjetas, débito y transferencia'}
                </p>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
