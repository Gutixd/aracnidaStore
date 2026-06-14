'use client'

import { useCart } from '@/store/cart'
import { formatPrice } from '@/lib/utils'
import Image from 'next/image'
import Link from 'next/link'
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight, ArrowLeft } from 'lucide-react'

export default function CartPage() {
  const { items, removeItem, updateQuantity, getTotalPrice, clearCart } = useCart()
  const total = getTotalPrice()
  const FREE_SHIPPING = 50000
  const SHIPPING = 3000

  if (items.length === 0) {
    return (
      <div style={{ background: 'var(--gray-50)', minHeight: '100vh' }} className="flex items-center justify-center px-4">
        <div className="text-center animate-fade-up">
          <div className="w-24 h-24 rounded-3xl flex items-center justify-center mx-auto mb-6" style={{ background: '#fff', boxShadow: 'var(--shadow)' }}>
            <ShoppingBag size={40} style={{ color: 'var(--gray-200)' }} />
          </div>
          <h1 className="text-2xl font-black mb-3" style={{ color: 'var(--text)' }}>Tu carrito está vacío</h1>
          <p className="mb-8" style={{ color: 'var(--gray-600)' }}>Agrega productos para continuar</p>
          <Link href="/products" className="btn-primary text-base px-8 py-4">
            <ShoppingBag size={18} />Ver catálogo
          </Link>
        </div>
      </div>
    )
  }

  const shippingCost = total >= FREE_SHIPPING ? 0 : SHIPPING
  const orderTotal = total + shippingCost

  return (
    <div style={{ background: 'var(--gray-50)', minHeight: '100vh' }}>
      <div className="max-w-6xl mx-auto pt-28 pb-24 px-4 sm:px-6 lg:px-8">
        <div className="mb-10">
          <h1 className="text-3xl font-black" style={{ color: 'var(--text)' }}>Carrito de compras</h1>
          <p className="mt-1" style={{ color: 'var(--gray-600)' }}>{items.length} {items.length === 1 ? 'producto' : 'productos'}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map(({ product, variant, quantity }) => (
              <div key={variant.id} className="card p-4 flex gap-4">
                <div className="w-24 h-24 rounded-xl overflow-hidden shrink-0 relative" style={{ background: 'var(--gray-50)' }}>
                  {product.image_url ? (
                    <Image src={product.image_url} alt={product.name} fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center" style={{ color: 'var(--gray-200)' }}>
                      <ShoppingBag size={24} />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-semibold text-sm leading-tight mb-1" style={{ color: 'var(--text)' }}>{product.name}</h3>
                      <div className="flex items-center gap-2">
                        <span className="text-xs px-2 py-0.5 rounded-md font-medium" style={{ background: 'var(--gray-50)', color: 'var(--gray-600)' }}>
                          Talla: {variant.size}
                        </span>
                      </div>
                    </div>
                    <button onClick={() => removeItem(variant.id)} aria-label="Eliminar"
                      className="transition-colors shrink-0" style={{ color: 'var(--gray-400)' }}>
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center gap-1 rounded-xl p-1" style={{ border: '1.5px solid var(--gray-200)' }}>
                      <button onClick={() => updateQuantity(variant.id, quantity - 1)} aria-label="Disminuir"
                        className="w-7 h-7 flex items-center justify-center transition-colors" style={{ color: 'var(--gray-600)' }}>
                        <Minus size={14} />
                      </button>
                      <span className="w-8 text-center text-sm font-bold tabular-nums">{quantity}</span>
                      <button onClick={() => updateQuantity(variant.id, quantity + 1)} disabled={quantity >= variant.stock} aria-label="Aumentar"
                        className="w-7 h-7 flex items-center justify-center transition-colors disabled:opacity-30" style={{ color: 'var(--gray-600)' }}>
                        <Plus size={14} />
                      </button>
                    </div>
                    <span className="font-black" style={{ color: 'var(--text)' }}>{formatPrice(variant.price * quantity)}</span>
                  </div>
                </div>
              </div>
            ))}

            <button onClick={clearCart} className="text-xs transition-colors mt-2" style={{ color: 'var(--gray-400)' }}>
              Vaciar carrito
            </button>
          </div>

          {/* Resumen */}
          <div className="lg:col-span-1">
            <div className="card p-6 sticky top-24">
              <h2 className="text-lg font-black mb-6" style={{ color: 'var(--text)' }}>Resumen de compra</h2>
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span style={{ color: 'var(--gray-600)' }}>Subtotal</span>
                  <span style={{ color: 'var(--text)' }} className="font-semibold tabular-nums">{formatPrice(total)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span style={{ color: 'var(--gray-600)' }}>Envío</span>
                  <span className="font-semibold tabular-nums" style={{ color: shippingCost === 0 ? '#15803d' : 'var(--text)' }}>
                    {shippingCost === 0 ? 'Gratis' : formatPrice(shippingCost)}
                  </span>
                </div>
                {shippingCost > 0 && (
                  <p className="text-xs" style={{ color: 'var(--gray-400)' }}>
                    Envío gratis en compras sobre {formatPrice(FREE_SHIPPING)}
                  </p>
                )}
                <div className="pt-3 flex justify-between" style={{ borderTop: '1px solid var(--gray-100)' }}>
                  <span className="font-bold" style={{ color: 'var(--text)' }}>Total</span>
                  <span className="font-black text-xl tabular-nums" style={{ color: 'var(--red)' }}>{formatPrice(orderTotal)}</span>
                </div>
              </div>

              <Link href="/checkout" className="btn-primary w-full justify-center py-4">
                Continuar compra <ArrowRight size={18} />
              </Link>
              <Link href="/products" className="flex items-center justify-center gap-2 mt-3 text-sm transition-colors py-2" style={{ color: 'var(--gray-600)' }}>
                <ArrowLeft size={14} /> Seguir comprando
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
