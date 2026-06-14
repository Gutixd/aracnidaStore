'use client'

import { Product } from '@/types'
import { useCart } from '@/store/cart'
import { ShoppingCart, Check } from 'lucide-react'
import { useState } from 'react'
import Link from 'next/link'

export function AddToCartButton({ product }: { product: Product }) {
  const { addItem, items } = useCart()
  const [added, setAdded] = useState(false)
  const inCart = items.some((i) => i.product.id === product.id)
  const isOutOfStock = product.stock === 0

  function handleAdd() {
    if (isOutOfStock) return
    addItem(product)
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  if (isOutOfStock) {
    return (
      <button
        disabled
        className="w-full py-4 rounded-xl font-bold text-white/30 bg-white/5 border border-white/10 cursor-not-allowed"
      >
        Sin stock disponible
      </button>
    )
  }

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <button
        onClick={handleAdd}
        className="flex-1 py-4 rounded-xl font-bold text-white flex items-center justify-center gap-2 transition-all duration-200 active:scale-[0.98]"
        style={{
          background: added
            ? 'linear-gradient(135deg, #16a34a, #15803d)'
            : 'linear-gradient(135deg, #c0392b, #a93226)',
        }}
      >
        {added ? <Check size={18} /> : <ShoppingCart size={18} />}
        {added ? '¡Agregado al carrito!' : 'Agregar al carrito'}
      </button>
      {inCart && !added && (
        <Link
          href="/cart"
          className="px-6 py-4 rounded-xl font-bold text-white/70 bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-center whitespace-nowrap"
        >
          Ver carrito
        </Link>
      )}
    </div>
  )
}
