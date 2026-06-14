'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Product } from '@/types'
import { formatPrice } from '@/lib/utils'
import { useCart } from '@/store/cart'
import { ShoppingCart, Eye } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'

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
            <span className="text-xs font-semibold bg-red-700 text-white px-2.5 py-1 rounded-full">
              Destacado
            </span>
          )}
          {isOutOfStock && (
            <span className="text-xs font-semibold bg-black/80 text-white/60 px-2.5 py-1 rounded-full border border-white/10">
              Agotado
            </span>
          )}
          {isLowStock && !isOutOfStock && (
            <span className="text-xs font-semibold bg-yellow-600/20 text-yellow-400 border border-yellow-600/30 px-2.5 py-1 rounded-full">
              Últimas {product.stock}
            </span>
          )}
        </div>

        {/* Quick actions */}
        <div className="absolute top-3 right-3 z-10 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <div className="w-8 h-8 bg-white/10 backdrop-blur rounded-lg flex items-center justify-center text-white hover:bg-white/20 transition-colors">
            <Eye size={14} />
          </div>
        </div>

        {/* Image */}
        <div className="relative aspect-[4/5] bg-[#0d1117] overflow-hidden">
          {product.image_url ? (
            <Image
              src={product.image_url}
              alt={product.name}
              fill
              className={cn(
                'object-cover transition-all duration-500 group-hover:scale-105',
                isOutOfStock && 'opacity-40 grayscale'
              )}
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white/10">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-16 h-16">
                <path d="M21 16.5c0 .38-.21.71-.53.88l-7.9 4.44c-.16.12-.36.18-.57.18-.21 0-.41-.06-.57-.18l-7.9-4.44A1.002 1.002 0 013 16.5v-9c0-.38.21-.71.53-.88l7.9-4.44c.16-.12.36-.18.57-.18.21 0 .41.06.57.18l7.9 4.44c.32.17.53.5.53.88v9z"/>
              </svg>
            </div>
          )}

          {/* Add to cart overlay */}
          {!isOutOfStock && (
            <button
              onClick={handleAddToCart}
              className={cn(
                'absolute bottom-0 left-0 right-0 py-3 text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2',
                'translate-y-full group-hover:translate-y-0',
                added
                  ? 'bg-green-700 text-white'
                  : 'bg-red-700 hover:bg-red-800 text-white'
              )}
            >
              <ShoppingCart size={14} />
              {added ? '¡Agregado!' : 'Agregar al carrito'}
            </button>
          )}
        </div>

        {/* Info */}
        <div className="p-4">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className="text-sm font-semibold text-white/90 leading-tight line-clamp-2 group-hover:text-white transition-colors">
              {product.name}
            </h3>
          </div>
          <div className="flex items-center gap-2 mt-1 mb-3">
            {product.size !== 'Única' && (
              <span className="text-xs text-white/30 bg-white/5 px-2 py-0.5 rounded">
                T: {product.size}
              </span>
            )}
            <span className="text-xs text-white/30 bg-white/5 px-2 py-0.5 rounded capitalize">
              {product.color}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-lg font-bold text-white">
              {formatPrice(product.price)}
            </span>
            {isOutOfStock && (
              <span className="text-xs text-white/30">Sin stock</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}
