'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Product } from '@/types'
import { formatPrice } from '@/lib/utils'
import { useCart } from '@/store/cart'
import { ShoppingCart, Check, SlidersHorizontal } from 'lucide-react'
import { useState } from 'react'

interface ProductCardProps {
  product: Product
}

export function ProductCard({ product }: ProductCardProps) {
  const { addItem, items } = useCart()
  const [added, setAdded] = useState(false)

  const variants = (product.variants ?? []).filter((v) => v.active)
  const isSingle = variants.length === 1
  const totalStock = variants.length
    ? variants.reduce((s, v) => s + v.stock, 0)
    : product.stock
  const minPrice = variants.length ? Math.min(...variants.map((v) => v.price)) : product.price
  const hasMultiplePrices = variants.length > 1 && new Set(variants.map((v) => v.price)).size > 1

  const isOutOfStock = totalStock === 0
  const isLowStock = totalStock > 0 && totalStock <= 3
  const inCart = isSingle && variants[0] ? items.some((i) => i.variant.id === variants[0].id) : false

  function handleQuickAdd(e: React.MouseEvent) {
    e.preventDefault()
    if (isOutOfStock || !isSingle) return
    addItem(product, variants[0])
    setAdded(true)
    setTimeout(() => setAdded(false), 1500)
  }

  return (
    <Link href={`/products/${product.slug}`} className="group block">
      <div className="card-product relative">
        {/* Badges */}
        <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5">
          {product.featured && (
            <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: 'var(--red)', color: '#fff' }}>
              Destacado
            </span>
          )}
          {isLowStock && (
            <span className="text-xs font-bold px-2.5 py-1 rounded-full"
              style={{ background: 'rgba(234,179,8,.12)', color: '#92400e', border: '1px solid rgba(234,179,8,.3)' }}>
              Últimas {totalStock}
            </span>
          )}
          {isOutOfStock && (
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
              style={{ background: 'var(--gray-50)', color: 'var(--gray-400)', border: '1px solid var(--gray-100)' }}>
              Agotado
            </span>
          )}
        </div>

        {/* Imagen */}
        <div className="relative aspect-[4/5] overflow-hidden" style={{ background: 'var(--gray-50)' }}>
          {product.image_url ? (
            <Image
              src={product.image_url}
              alt={product.name}
              fill
              className={`object-cover transition-transform duration-500 group-hover:scale-105 ${isOutOfStock ? 'opacity-50 grayscale' : ''}`}
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center" style={{ color: 'var(--gray-200)' }}>
              <ShoppingCart size={48} />
            </div>
          )}

          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            style={{ background: 'linear-gradient(to top, rgba(26,39,68,.6) 0%, transparent 55%)' }} />

          {/* Acción inferior */}
          {!isOutOfStock && (
            isSingle ? (
              <button
                onClick={handleQuickAdd}
                className="absolute bottom-0 left-0 right-0 py-3.5 text-sm font-bold text-white flex items-center justify-center gap-2 transition-transform duration-300 translate-y-full group-hover:translate-y-0"
                style={added ? { background: '#16a34a' } : { background: 'linear-gradient(135deg, #c0392b, #e74c3c)' }}
              >
                {added ? <><Check size={15} strokeWidth={3} />¡Listo!</> : <><ShoppingCart size={15} />Agregar</>}
              </button>
            ) : (
              <span
                className="absolute bottom-0 left-0 right-0 py-3.5 text-sm font-bold text-white flex items-center justify-center gap-2 transition-transform duration-300 translate-y-full group-hover:translate-y-0"
                style={{ background: 'linear-gradient(135deg, #1a2744, #2c3e6b)' }}
              >
                <SlidersHorizontal size={15} />Elegir talla
              </span>
            )
          )}
        </div>

        {/* Info */}
        <div className="p-4">
          <h3 className="text-sm font-semibold leading-snug line-clamp-2 mb-2 transition-colors group-hover:text-red-700" style={{ color: 'var(--text)' }}>
            {product.name}
          </h3>

          <div className="flex items-center gap-1.5 mb-3">
            {variants.length > 1 ? (
              <span className="text-xs px-2 py-0.5 rounded-md font-medium" style={{ background: 'var(--gray-50)', color: 'var(--gray-600)' }}>
                {variants.length} tallas
              </span>
            ) : (
              product.color && (
                <span className="text-xs px-2 py-0.5 rounded-md font-medium" style={{ background: 'var(--gray-50)', color: 'var(--gray-600)' }}>
                  {product.color}
                </span>
              )
            )}
          </div>

          <div className="flex items-center justify-between">
            <span className="text-lg font-black" style={{ color: isOutOfStock ? 'var(--gray-400)' : 'var(--red)' }}>
              {hasMultiplePrices && <span className="text-xs font-semibold mr-1" style={{ color: 'var(--gray-400)' }}>Desde</span>}
              {formatPrice(minPrice)}
            </span>
            {inCart && !added && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: 'rgba(22,163,74,.1)', color: '#15803d' }}>
                En carrito
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}
