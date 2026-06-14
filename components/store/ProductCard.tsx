'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Product } from '@/types'
import { formatPrice } from '@/lib/utils'
import { useCart } from '@/store/cart'
import { ShoppingCart, Check } from 'lucide-react'
import { useState } from 'react'

interface ProductCardProps {
  product: Product
}

export function ProductCard({ product }: ProductCardProps) {
  const { addItem, items } = useCart()
  const [added, setAdded] = useState(false)

  const inCart = items.some((i) => i.product.id === product.id)
  const isOutOfStock = product.stock === 0
  const isLowStock = product.stock > 0 && product.stock <= 3

  function handleAddToCart(e: React.MouseEvent) {
    e.preventDefault()
    if (isOutOfStock) return
    addItem(product)
    setAdded(true)
    setTimeout(() => setAdded(false), 1500)
  }

  return (
    <Link href={`/products/${product.slug}`} className="group block">
      <div className="card-product relative">

        {/* Badges */}
        <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5">
          {product.featured && (
            <span className="text-xs font-bold px-2.5 py-1 rounded-full"
              style={{ background: '#c0392b', color: '#fff' }}>
              Destacado
            </span>
          )}
          {isLowStock && !isOutOfStock && (
            <span className="text-xs font-bold px-2.5 py-1 rounded-full"
              style={{ background: 'rgba(234,179,8,.12)', color: '#92400e', border: '1px solid rgba(234,179,8,.3)' }}>
              Últimas {product.stock}
            </span>
          )}
          {isOutOfStock && (
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
              style={{ background: '#f7f7f5', color: '#9b9b93', border: '1px solid #efefec' }}>
              Agotado
            </span>
          )}
        </div>

        {/* Image */}
        <div className="relative aspect-[4/5] overflow-hidden" style={{ background: '#f7f7f5' }}>
          {product.image_url ? (
            <Image
              src={product.image_url}
              alt={product.name}
              fill
              className={`object-cover transition-transform duration-500 group-hover:scale-107 ${isOutOfStock ? 'opacity-50 grayscale' : ''}`}
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center" style={{ color: '#ddddd8' }}>
              <ShoppingCart size={48} />
            </div>
          )}

          {/* Hover overlay */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            style={{ background: 'linear-gradient(to top, rgba(26,39,68,.7) 0%, transparent 60%)' }} />

          {/* Add to cart button */}
          {!isOutOfStock && (
            <button
              onClick={handleAddToCart}
              className="absolute bottom-0 left-0 right-0 py-3.5 text-sm font-bold text-white flex items-center justify-center gap-2 transition-all duration-300 translate-y-full group-hover:translate-y-0"
              style={added
                ? { background: '#16a34a' }
                : { background: 'linear-gradient(135deg, #c0392b, #e74c3c)' }}
            >
              {added ? (
                <><Check size={15} strokeWidth={3} />¡Listo!</>
              ) : (
                <><ShoppingCart size={15} />Agregar al carrito</>
              )}
            </button>
          )}
        </div>

        {/* Info */}
        <div className="p-4">
          <h3 className="text-sm font-semibold leading-snug line-clamp-2 mb-2 transition-colors group-hover:text-red-700"
            style={{ color: '#1a1a18' }}>
            {product.name}
          </h3>

          <div className="flex items-center gap-1.5 mb-3">
            {product.size && product.size !== 'Única' && (
              <span className="text-xs px-2 py-0.5 rounded-md font-medium"
                style={{ background: '#f7f7f5', color: '#5a5a54' }}>
                T: {product.size}
              </span>
            )}
            {product.color && (
              <span className="text-xs px-2 py-0.5 rounded-md font-medium"
                style={{ background: '#f7f7f5', color: '#5a5a54' }}>
                {product.color}
              </span>
            )}
          </div>

          <div className="flex items-center justify-between">
            <span className="text-lg font-black" style={{ color: isOutOfStock ? '#9b9b93' : '#c0392b' }}>
              {formatPrice(product.price)}
            </span>
            {inCart && !added && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                style={{ background: 'rgba(22,163,74,.1)', color: '#15803d' }}>
                En carrito
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}
