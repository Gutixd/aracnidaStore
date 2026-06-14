'use client'

import { useCart } from '@/store/cart'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { checkoutSchema, CheckoutFormData } from '@/lib/validations'
import { createOrder } from '@/lib/actions/orders'
import { formatPrice } from '@/lib/utils'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ShoppingBag, Loader2, MapPin, Store } from 'lucide-react'

const SHIPPING_COST = 3000
const FREE_SHIPPING_THRESHOLD = 50000

export default function CheckoutPage() {
  const { items, getTotalPrice, clearCart } = useCart()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const subtotal = getTotalPrice()
  const shippingCost = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_COST
  const total = subtotal + shippingCost

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: { delivery_method: 'delivery' },
  })

  const deliveryMethod = watch('delivery_method')

  if (items.length === 0) {
    return (
      <div className="pt-24 pb-24 px-4 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <ShoppingBag size={48} className="mx-auto mb-4 text-white/20" />
          <h1 className="text-2xl font-bold text-white mb-4">No hay productos en el carrito</h1>
          <Link href="/products" className="inline-flex items-center gap-2 font-bold px-8 py-4 rounded-xl text-white"
            style={{ background: 'linear-gradient(135deg, #c0392b, #a93226)' }}>
            Ver catálogo
          </Link>
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
      router.push(`/order-success/${result.orderId}`)
    } catch {
      setError('Error inesperado. Por favor intenta nuevamente.')
      setLoading(false)
    }
  }

  const inputClass = "w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder:text-white/30 focus:outline-none focus:border-red-600/50 transition-all text-sm"
  const labelClass = "block text-sm font-medium text-white/60 mb-1.5"

  return (
    <div className="pt-24 pb-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-white">Finalizar compra</h1>
          <p className="text-white/40 mt-1">Completa tus datos para realizar el pedido</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            {/* Form */}
            <div className="lg:col-span-3 space-y-6">
              {/* Contact */}
              <div className="bg-[#111827] border border-white/5 rounded-xl p-6">
                <h2 className="text-lg font-semibold text-white mb-5">Datos de contacto</h2>
                <div className="space-y-4">
                  <div>
                    <label className={labelClass}>Nombre completo *</label>
                    <input {...register('customer_name')} placeholder="Tu nombre completo" className={inputClass} />
                    {errors.customer_name && <p className="text-red-400 text-xs mt-1">{errors.customer_name.message}</p>}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass}>Email *</label>
                      <input {...register('customer_email')} type="email" placeholder="tu@email.com" className={inputClass} />
                      {errors.customer_email && <p className="text-red-400 text-xs mt-1">{errors.customer_email.message}</p>}
                    </div>
                    <div>
                      <label className={labelClass}>Teléfono *</label>
                      <input {...register('customer_phone')} placeholder="+56 9 1234 5678" className={inputClass} />
                      {errors.customer_phone && <p className="text-red-400 text-xs mt-1">{errors.customer_phone.message}</p>}
                    </div>
                  </div>
                </div>
              </div>

              {/* Delivery method */}
              <div className="bg-[#111827] border border-white/5 rounded-xl p-6">
                <h2 className="text-lg font-semibold text-white mb-5">Método de entrega</h2>
                <div className="grid grid-cols-2 gap-3 mb-5">
                  <label className={`relative flex flex-col gap-2 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    deliveryMethod === 'delivery'
                      ? 'border-red-600 bg-red-900/10'
                      : 'border-white/10 bg-white/[0.02] hover:border-white/20'
                  }`}>
                    <input type="radio" value="delivery" {...register('delivery_method')} className="sr-only" />
                    <MapPin size={20} className={deliveryMethod === 'delivery' ? 'text-red-400' : 'text-white/30'} />
                    <div>
                      <p className="font-semibold text-white text-sm">Delivery</p>
                      <p className="text-xs text-white/40">
                        {shippingCost === 0 ? 'Gratis' : formatPrice(SHIPPING_COST)}
                      </p>
                    </div>
                  </label>
                  <label className={`relative flex flex-col gap-2 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    deliveryMethod === 'retiro'
                      ? 'border-red-600 bg-red-900/10'
                      : 'border-white/10 bg-white/[0.02] hover:border-white/20'
                  }`}>
                    <input type="radio" value="retiro" {...register('delivery_method')} className="sr-only" />
                    <Store size={20} className={deliveryMethod === 'retiro' ? 'text-red-400' : 'text-white/30'} />
                    <div>
                      <p className="font-semibold text-white text-sm">Retiro en tienda</p>
                      <p className="text-xs text-white/40">Gratis</p>
                    </div>
                  </label>
                </div>

                {deliveryMethod === 'delivery' && (
                  <div className="space-y-4">
                    <div>
                      <label className={labelClass}>Dirección *</label>
                      <input {...register('delivery_address')} placeholder="Calle, número, depto" className={inputClass} />
                      {errors.delivery_address && <p className="text-red-400 text-xs mt-1">{errors.delivery_address.message}</p>}
                    </div>
                    <div>
                      <label className={labelClass}>Comuna / Ciudad *</label>
                      <input {...register('delivery_commune')} placeholder="Santiago, Providencia, etc." className={inputClass} />
                      {errors.delivery_commune && <p className="text-red-400 text-xs mt-1">{errors.delivery_commune.message}</p>}
                    </div>
                    <div>
                      <label className={labelClass}>Referencia de entrega</label>
                      <input {...register('delivery_reference')} placeholder="Casa azul, edificio frente al banco..." className={inputClass} />
                    </div>
                  </div>
                )}
              </div>

              {/* Notes */}
              <div className="bg-[#111827] border border-white/5 rounded-xl p-6">
                <h2 className="text-lg font-semibold text-white mb-5">Notas del pedido</h2>
                <textarea
                  {...register('notes')}
                  placeholder="Instrucciones especiales, tallas alternativas, etc."
                  rows={3}
                  className={`${inputClass} resize-none`}
                />
              </div>
            </div>

            {/* Order summary */}
            <div className="lg:col-span-2">
              <div className="bg-[#111827] border border-white/5 rounded-xl p-6 sticky top-24">
                <h2 className="text-lg font-semibold text-white mb-5">Tu pedido</h2>

                {/* Items */}
                <div className="space-y-3 mb-5">
                  {items.map(({ product, quantity }) => (
                    <div key={product.id} className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-[#0d1117] rounded-lg overflow-hidden relative shrink-0">
                        {product.image_url && (
                          <Image src={product.image_url} alt={product.name} fill className="object-cover" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white/80 truncate">{product.name}</p>
                        <p className="text-xs text-white/30">{product.size} · x{quantity}</p>
                      </div>
                      <span className="text-sm font-semibold text-white shrink-0">
                        {formatPrice(product.price * quantity)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Totals */}
                <div className="border-t border-white/5 pt-4 space-y-2 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-white/50">Subtotal</span>
                    <span className="text-white">{formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-white/50">Envío</span>
                    <span className={shippingCost === 0 ? 'text-green-400' : 'text-white'}>
                      {shippingCost === 0 ? 'Gratis' : formatPrice(shippingCost)}
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-white/5 pt-3 mt-2">
                    <span className="font-bold text-white">Total</span>
                    <span className="font-black text-white text-xl">{formatPrice(total)}</span>
                  </div>
                </div>

                {error && (
                  <div className="bg-red-900/20 border border-red-800/30 rounded-lg p-3 mb-4 text-sm text-red-400">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-4 rounded-xl font-bold text-white disabled:opacity-60 transition-all"
                  style={{ background: 'linear-gradient(135deg, #c0392b, #a93226)' }}
                >
                  {loading ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Procesando pedido...
                    </>
                  ) : (
                    'Confirmar pedido'
                  )}
                </button>

                <p className="text-xs text-white/20 text-center mt-4">
                  Al confirmar aceptas nuestros términos de servicio
                </p>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
