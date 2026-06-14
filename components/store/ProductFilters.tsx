'use client'

import { Category } from '@/types'
import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'
import { Search, SlidersHorizontal, X } from 'lucide-react'

interface ProductFiltersProps {
  categories: Category[]
  currentParams: Record<string, string | undefined>
}

const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Única']

export function ProductFilters({ categories, currentParams }: ProductFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const updateParam = useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value) params.set(key, value)
      else params.delete(key)
      router.push(`/products?${params.toString()}`)
    },
    [router, searchParams]
  )

  const clearAll = () => router.push('/products')

  const hasFilters = Object.values(currentParams).some(Boolean)

  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
        <input
          type="text"
          placeholder="Buscar productos..."
          defaultValue={currentParams.search}
          onChange={(e) => updateParam('search', e.target.value || null)}
          className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-red-600/50"
        />
      </div>

      {/* Active filters */}
      {hasFilters && (
        <button
          onClick={clearAll}
          className="flex items-center gap-2 text-xs text-red-400 hover:text-red-300 transition-colors"
        >
          <X size={12} />
          Limpiar filtros
        </button>
      )}

      {/* Sort */}
      <div>
        <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3 flex items-center gap-2">
          <SlidersHorizontal size={12} />
          Ordenar
        </h3>
        <div className="space-y-1.5">
          {[
            { value: 'newest', label: 'Más recientes' },
            { value: 'price_asc', label: 'Menor precio' },
            { value: 'price_desc', label: 'Mayor precio' },
          ].map((opt) => (
            <button
              key={opt.value}
              onClick={() => updateParam('sort', opt.value)}
              className={`w-full text-left text-sm px-3 py-2 rounded-lg transition-colors ${
                (currentParams.sort ?? 'newest') === opt.value
                  ? 'bg-red-900/20 text-red-400 border border-red-800/30'
                  : 'text-white/50 hover:text-white/80 hover:bg-white/5'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Category */}
      <div>
        <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">
          Categoría
        </h3>
        <div className="space-y-1.5">
          <button
            onClick={() => updateParam('category', null)}
            className={`w-full text-left text-sm px-3 py-2 rounded-lg transition-colors ${
              !currentParams.category
                ? 'bg-red-900/20 text-red-400 border border-red-800/30'
                : 'text-white/50 hover:text-white/80 hover:bg-white/5'
            }`}
          >
            Todos
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => updateParam('category', cat.slug)}
              className={`w-full text-left text-sm px-3 py-2 rounded-lg transition-colors capitalize ${
                currentParams.category === cat.slug
                  ? 'bg-red-900/20 text-red-400 border border-red-800/30'
                  : 'text-white/50 hover:text-white/80 hover:bg-white/5'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Size */}
      <div>
        <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">
          Talla
        </h3>
        <div className="flex flex-wrap gap-2">
          {SIZES.map((size) => (
            <button
              key={size}
              onClick={() =>
                updateParam('size', currentParams.size === size ? null : size)
              }
              className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                currentParams.size === size
                  ? 'bg-red-900/20 text-red-400 border-red-800/30'
                  : 'bg-white/5 text-white/50 border-white/10 hover:border-white/20'
              }`}
            >
              {size}
            </button>
          ))}
        </div>
      </div>

      {/* Price range */}
      <div>
        <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">
          Precio
        </h3>
        <div className="space-y-2">
          {[
            { label: 'Hasta $20.000', min: undefined, max: '20000' },
            { label: '$20.000 - $40.000', min: '20000', max: '40000' },
            { label: '$40.000 - $60.000', min: '40000', max: '60000' },
            { label: 'Más de $60.000', min: '60000', max: undefined },
          ].map((range) => {
            const isActive =
              currentParams.min === range.min && currentParams.max === range.max
            return (
              <button
                key={range.label}
                onClick={() => {
                  if (isActive) {
                    updateParam('min', null)
                    updateParam('max', null)
                  } else {
                    const params = new URLSearchParams(searchParams.toString())
                    if (range.min) params.set('min', range.min)
                    else params.delete('min')
                    if (range.max) params.set('max', range.max)
                    else params.delete('max')
                    router.push(`/products?${params.toString()}`)
                  }
                }}
                className={`w-full text-left text-sm px-3 py-2 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-red-900/20 text-red-400 border border-red-800/30'
                    : 'text-white/50 hover:text-white/80 hover:bg-white/5'
                }`}
              >
                {range.label}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
