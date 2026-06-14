'use client'

import { useCart } from '@/store/cart'
import { formatPrice } from '@/lib/utils'
import Image from 'next/image'
import Link from 'next/link'
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight } from 'lucide-react'

export default function CartPage() {
  const { items, removeItem, updateQuantity, getTotalPrice, clearCart } = useCart()
  const total = getTotalPrice()
  const FREE_SHIPPING = 50000
  const SHIPPING = 3000

  if (items.length === 0) {
    return (
      <div className="pt-24 pb-24 px-4 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-24 h-24 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <ShoppingBag size={40} className="text-white/20" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-3">Tu carrito está vacío</h1>
          <p className="text-white/40 mb-8">Agrega productos para continuar</p>
          <Link
            href="/products"
            className="inline-flex items-center gap-2 font-bold px-8 py-4 rounded-xl text-white"
            style={{ background: 'linear-gradient(135deg, #c0392b, #a93226)' }}
          >
            <ShoppingBag size={18} />
            Ver catálogo
          </Link>
        </div>
      </div>
    )
  }

  const shippingCost = total >= FREE_SHIPPING ? 0 : SHIPPING
  const orderTotal = total + shippingCost

  return (
    <div className="pt-24 pb-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-white">Carrito de compras</h1>
          <p className="text-white/40 mt-1">{items.length} {items.length === 1 ? 'producto' : 'productos'}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map(({ product, quantity }) => (
              <div
                key={product.id}
                className="bg-[#111827] border border-white/5 rounded-xl p-4 flex gap-4 hover:border-white/10 transition-colors"
              >
                {/* Image */}
                <div className="w-24 h-24 bg-[#0d1117] rounded-lg overflow-hidden shrink-0 relative">
                  {product.image_url ? (
                    <Image src={product.image_url} alt={product.name} fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white/10">
                      <ShoppingBag size={24} />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-semibold text-white text-sm leading-tight mb-1">{product.name}</h3>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-white/30 bg-white/5 px-2 py-0.5 rounded">T: {product.size}</span>
                        <span className="text-xs text-white/30 bg-white/5 px-2 py-0.5 rounded capitalize">{product.color}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => removeItem(product.id)}
                      className="text-white/20 hover:text-red-400 transition-colors shrink-0"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between mt-4">
                    {/* Quantity */}
                    <div className="flex items-center gap-2 bg-white/5 rounded-lg border border-white/10 p-1">
                      <button
                        onClick={() => updateQuantity(product.id, quantity - 1)}
                        className="w-7 h-7 flex items-center justify-center text-white/50 hover:text-white transition-colors"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="w-8 text-center text-sm font-semibold text-white">{quantity}</span>
                      <button
                        onClick={() => updateQuantity(product.id, quantity + 1)}
                        disabled={quantity >= product.stock}
                        className="w-7 h-7 flex items-center justify-center text-white/50 hover:text-white transition-colors disabled:opacity-30"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                    <span className="font-bold text-white">{formatPrice(product.price * quantity)}</span>
                  </div>
                </div>
              </div>
            ))}

            <button
              onClick={clearCart}
              className="text-xs text-white/30 hover:text-red-400 transition-colors mt-2"
            >
              Vaciar carrito
            </button>
          </div>

          {/* Summary */}
          <div className="lg:col-span-1">
            <div className="bg-[#111827] border border-white/5 rounded-xl p-6 sticky top-24">
              <h2 className="text-lg font-bold text-white mb-6">Resumen de compra</h2>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-white/50">Subtotal</span>
                  <span className="text-white">{formatPrice(total)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-white/50">Envío</span>
                  <span className={shippingCost === 0 ? 'text-green-400' : 'text-white'}>
                    {shippingCost === 0 ? 'Gratis' : formatPrice(shippingCost)}
                  </span>
                </div>
                {shippingCost > 0 && (
                  <p className="text-xs text-white/30">
                    Envío gratis en compras sobre {formatPrice(FREE_SHIPPING)}
                  </p>
                )}
                <div className="border-t border-white/5 pt-3 flex justify-between">
                  <span className="font-bold text-white">Total</span>
                  <span className="font-bold text-white text-xl">{formatPrice(orderTotal)}</span>
                </div>
              </div>

              <Link
                href="/checkout"
                className="w-full flex items-center justify-center gap-2 py-4 rounded-xl font-bold text-white transition-all duration-200"
                style={{ background: 'linear-gradient(135deg, #c0392b, #a93226)' }}
              >
                Continuar compra
                <ArrowRight size={18} />
              </Link>

              <Link
                href="/products"
                className="w-full flex items-center justify-center mt-3 text-sm text-white/40 hover:text-white/70 transition-colors py-2"
              >
                ← Seguir comprando
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
