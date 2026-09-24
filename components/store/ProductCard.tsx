'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Product } from '@/types'
import { formatPrice } from '@/lib/utils'
import { useCart } from '@/store/cart'
import { ShoppingCart, Check, SlidersHorizontal } from 'lucide-react'
import { useState } from 'react'
import { calcReservation } from '@/lib/reservations'

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
  // Solo se anuncia el alza si de verdad es más cara que lo que se cobra hoy.
  const risesTo =
    product.future_price && product.future_price > minPrice ? product.future_price : null

  const reservePrice = calcReservation(minPrice, 1).final
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
        {/* Imagen sobre fondo neutro parejo: todas las fotos se ven como
            una colección, no como recortes pegados. */}
        <div className="relative aspect-square overflow-hidden rounded-[var(--radius)]" style={{ background: 'var(--gray-50)' }}>
          {product.image_url ? (
            <Image
              src={product.image_url}
              alt={`${product.name} - Spider-Man Chile`}
              fill
              className={`object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03] ${isOutOfStock ? 'opacity-40 grayscale' : ''}`}
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 50vw, 25vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center" style={{ color: 'var(--gray-200)' }}>
              <ShoppingCart size={48} />
            </div>
          )}

          {/* Una sola etiqueta, y solo si informa algo útil. "Destacado" iba
              en casi todos los productos, así que no destacaba nada. */}
          {(isOutOfStock || isLowStock) && (
            <span className="absolute top-2.5 left-2.5 text-[11px] font-semibold px-2 py-1 rounded-md"
              style={isOutOfStock
                ? { background: '#fff', color: 'var(--gray-600)', boxShadow: '0 0 0 1px var(--gray-100)' }
                : { background: '#fff', color: 'var(--red)', boxShadow: '0 0 0 1px var(--gray-100)' }}>
              {isOutOfStock ? 'Agotado' : `Últimas ${totalStock}`}
            </span>
          )}

          {/* Acción rápida (solo escritorio, al pasar el mouse) */}
          {!isOutOfStock && (
            isSingle ? (
              <button
                onClick={handleQuickAdd}
                className="hidden md:flex absolute bottom-2.5 left-2.5 right-2.5 py-2.5 rounded-lg text-sm font-semibold text-white items-center justify-center gap-2 opacity-0 translate-y-1 transition-all duration-200 group-hover:opacity-100 group-hover:translate-y-0"
                style={{ background: added ? '#15803d' : 'var(--ink)' }}
              >
                {added ? <><Check size={15} strokeWidth={3} />Agregado</> : <><ShoppingCart size={15} />Agregar</>}
              </button>
            ) : (
              <span
                className="hidden md:flex absolute bottom-2.5 left-2.5 right-2.5 py-2.5 rounded-lg text-sm font-semibold items-center justify-center gap-2 opacity-0 translate-y-1 transition-all duration-200 group-hover:opacity-100 group-hover:translate-y-0"
                style={{ background: '#fff', color: 'var(--text)', boxShadow: '0 0 0 1px var(--gray-200)' }}
              >
                <SlidersHorizontal size={15} />Elegir talla
              </span>
            )
          )}
        </div>

        {/* Info */}
        <div className="pt-3 px-0.5">
          <h3 className="text-[13px] sm:text-sm font-medium leading-snug line-clamp-2" style={{ color: 'var(--text)' }}>
            {product.name}
          </h3>
          <p className="text-xs mt-0.5" style={{ color: 'var(--gray-400)' }}>
            {variants.length > 1 ? `${variants.length} tallas` : product.color}
          </p>

          <div className="mt-2 flex items-baseline gap-1.5 flex-wrap">
            {hasMultiplePrices && <span className="text-xs" style={{ color: 'var(--gray-400)' }}>Desde</span>}
            <span className="text-[15px] sm:text-base font-semibold tabular-nums" style={{ color: isOutOfStock ? 'var(--gray-400)' : 'var(--text)' }}>
              {formatPrice(minPrice)}
            </span>
            {inCart && !added && (
              <span className="text-[11px] font-medium" style={{ color: '#15803d' }}>· En carrito</span>
            )}
          </div>
          {/* Aviso de alza, no un precio tachado: este producto nunca se
              vendió más caro, así que un "antes" sería falso. */}
          {risesTo && (
            <p className="text-[11px] mt-0.5" style={{ color: 'var(--gray-400)' }}>Sube a {formatPrice(risesTo)}</p>
          )}
          {/* Segundo precio REAL (el de reserva anticipada), sin inventar
              un precio "antes" que nunca se cobró. */}
          <p className="text-[11px] sm:text-xs mt-0.5 font-medium" style={{ color: '#15803d' }}>
            {formatPrice(reservePrice)} reservando
          </p>
        </div>
      </div>
    </Link>
  )
}
