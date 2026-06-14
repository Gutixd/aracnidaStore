'use client'

import { Product, ProductVariant } from '@/types'
import { useCart } from '@/store/cart'
import { formatPrice } from '@/lib/utils'
import { ShoppingCart, Check, Minus, Plus } from 'lucide-react'
import { useState, useMemo } from 'react'
import Link from 'next/link'

interface Props {
  product: Product
  variants: ProductVariant[]
}

export function ProductPurchase({ product, variants }: Props) {
  const { addItem, items } = useCart()
  const isSingle = variants.length === 1

  // Preselecciona la primera variante con stock
  const firstAvailable = useMemo(
    () => variants.find((v) => v.stock > 0) ?? variants[0],
    [variants]
  )
  const [selectedId, setSelectedId] = useState<string | null>(
    isSingle ? variants[0]?.id ?? null : firstAvailable?.id ?? null
  )
  const [quantity, setQuantity] = useState(1)
  const [added, setAdded] = useState(false)

  const selected = variants.find((v) => v.id === selectedId) ?? null
  const inCart = selected ? items.some((i) => i.variant.id === selected.id) : false
  const maxQty = selected?.stock ?? 0
  const totalStock = variants.reduce((s, v) => s + v.stock, 0)

  function handleAdd() {
    if (!selected || selected.stock === 0) return
    addItem(product, selected, quantity)
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  if (totalStock === 0) {
    return (
      <button disabled
        className="w-full py-4 rounded-xl font-bold cursor-not-allowed"
        style={{ background: 'var(--gray-100)', color: 'var(--gray-400)' }}>
        Agotado temporalmente
      </button>
    )
  }

  return (
    <div className="space-y-6">
      {/* Precio de la variante seleccionada */}
      <div className="flex items-baseline gap-3">
        <span className="text-4xl font-black" style={{ color: 'var(--red)' }}>
          {formatPrice(selected?.price ?? product.price)}
        </span>
        {!isSingle && (
          <span className="text-sm" style={{ color: 'var(--gray-400)' }}>
            Talla {selected?.size}
          </span>
        )}
      </div>

      {/* Selector de tallas (solo si hay más de una) */}
      {!isSingle && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold uppercase tracking-widest" style={{ color: 'var(--gray-600)', fontSize: '11px' }}>
              Selecciona tu talla (cm)
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {variants.map((v) => {
              const out = v.stock === 0
              const active = v.id === selectedId
              return (
                <button
                  key={v.id}
                  disabled={out}
                  onClick={() => { setSelectedId(v.id); setQuantity(1) }}
                  className="relative min-w-[52px] px-3 py-2.5 rounded-xl text-sm font-bold transition-all"
                  style={
                    out
                      ? { background: 'var(--gray-50)', color: 'var(--gray-200)', textDecoration: 'line-through', cursor: 'not-allowed', border: '1.5px solid var(--gray-100)' }
                      : active
                        ? { background: 'var(--red)', color: '#fff', border: '1.5px solid var(--red)', boxShadow: 'var(--shadow-red)' }
                        : { background: '#fff', color: 'var(--text)', border: '1.5px solid var(--gray-200)' }
                  }
                >
                  {v.size}
                </button>
              )
            })}
          </div>
          {selected && selected.stock > 0 && selected.stock <= 3 && (
            <p className="text-xs mt-2 font-semibold" style={{ color: '#b45309' }}>
              Solo quedan {selected.stock} en talla {selected.size}
            </p>
          )}
        </div>
      )}

      {/* Cantidad */}
      {selected && selected.stock > 0 && (
        <div className="flex items-center gap-4">
          <span className="text-sm font-semibold uppercase tracking-widest" style={{ color: 'var(--gray-600)', fontSize: '11px' }}>
            Cantidad
          </span>
          <div className="flex items-center gap-1 rounded-xl p-1" style={{ border: '1.5px solid var(--gray-200)' }}>
            <button onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
              style={{ color: 'var(--gray-600)' }}
              aria-label="Disminuir cantidad">
              <Minus size={15} />
            </button>
            <span className="w-8 text-center font-bold tabular-nums">{quantity}</span>
            <button onClick={() => setQuantity((q) => Math.min(maxQty, q + 1))}
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
              style={{ color: 'var(--gray-600)' }}
              aria-label="Aumentar cantidad">
              <Plus size={15} />
            </button>
          </div>
        </div>
      )}

      {/* Botón */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={handleAdd}
          disabled={!selected || selected.stock === 0}
          className="btn-primary flex-1 justify-center py-4 text-base"
          style={added ? { background: '#16a34a' } : undefined}
        >
          {added ? <><Check size={18} strokeWidth={3} />¡Agregado!</> : <><ShoppingCart size={18} />Agregar al carrito</>}
        </button>
        {inCart && !added && (
          <Link href="/cart" className="btn-ghost flex items-center justify-center py-4 px-6 whitespace-nowrap">
            Ver carrito
          </Link>
        )}
      </div>
    </div>
  )
}
