'use client'

import { Category } from '@/types'
import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'
import { Search, X } from 'lucide-react'

interface ProductFiltersProps {
  categories: Category[]
  currentParams: Record<string, string | undefined>
}

const SIZES = ['100','110','120','130','140','150','160','170','180','190','Única']

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

  const filterLabel = 'text-sm font-semibold uppercase tracking-widest mb-3 block'
  const filterStyle = { color: '#9b9b93', fontSize: '11px' }

  return (
    <div className="space-y-6">
      {/* Card wrapper */}
      <div className="card p-5 space-y-6">

        {/* Search */}
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#9b9b93' }} />
          <input
            type="text"
            placeholder="Buscar..."
            defaultValue={currentParams.search}
            onChange={(e) => updateParam('search', e.target.value || null)}
            className="input-field pl-9 text-sm"
          />
        </div>

        {hasFilters && (
          <button onClick={clearAll}
            className="flex items-center gap-1.5 text-xs font-semibold transition-colors hover:opacity-75"
            style={{ color: '#c0392b' }}>
            <X size={12} />Limpiar filtros
          </button>
        )}

        {/* Sort */}
        <div>
          <span className={filterLabel} style={filterStyle}>Ordenar</span>
          <div className="space-y-1">
            {[
              { value: 'newest', label: 'Más recientes' },
              { value: 'price_asc', label: 'Menor precio' },
              { value: 'price_desc', label: 'Mayor precio' },
            ].map((opt) => {
              const active = (currentParams.sort ?? 'newest') === opt.value
              return (
                <button key={opt.value} onClick={() => updateParam('sort', opt.value)}
                  className="w-full text-left text-sm px-3 py-2 rounded-xl transition-all"
                  style={active
                    ? { background: 'rgba(192,57,43,.1)', color: '#c0392b', fontWeight: 600 }
                    : { color: '#5a5a54' }}>
                  {opt.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Category */}
        <div>
          <span className={filterLabel} style={filterStyle}>Categoría</span>
          <div className="space-y-1">
            <button onClick={() => updateParam('category', null)}
              className="w-full text-left text-sm px-3 py-2 rounded-xl transition-all"
              style={!currentParams.category
                ? { background: 'rgba(192,57,43,.1)', color: '#c0392b', fontWeight: 600 }
                : { color: '#5a5a54' }}>
              Todos
            </button>
            {categories.map((cat) => {
              const active = currentParams.category === cat.slug
              return (
                <button key={cat.id} onClick={() => updateParam('category', cat.slug)}
                  className="w-full text-left text-sm px-3 py-2 rounded-xl transition-all capitalize"
                  style={active
                    ? { background: 'rgba(192,57,43,.1)', color: '#c0392b', fontWeight: 600 }
                    : { color: '#5a5a54' }}>
                  {cat.name}
                </button>
              )
            })}
          </div>
        </div>

        {/* Size */}
        <div>
          <span className={filterLabel} style={filterStyle}>Talla</span>
          <div className="flex flex-wrap gap-1.5">
            {SIZES.map((size) => {
              const active = currentParams.size === size
              return (
                <button key={size}
                  onClick={() => updateParam('size', currentParams.size === size ? null : size)}
                  className="px-2.5 py-1.5 text-xs rounded-lg border transition-all font-medium"
                  style={active
                    ? { background: '#c0392b', color: '#fff', borderColor: '#c0392b' }
                    : { background: '#fff', color: '#5a5a54', borderColor: '#ddddd8' }}>
                  {size}
                </button>
              )
            })}
          </div>
        </div>

        {/* Price */}
        <div>
          <span className={filterLabel} style={filterStyle}>Precio</span>
          <div className="space-y-1">
            {[
              { label: 'Hasta $25.000', min: undefined, max: '25000' },
              { label: '$25.000 - $45.000', min: '25000', max: '45000' },
              { label: '$45.000 - $70.000', min: '45000', max: '70000' },
              { label: 'Más de $70.000', min: '70000', max: undefined },
            ].map((range) => {
              const isActive = currentParams.min === range.min && currentParams.max === range.max
              return (
                <button key={range.label}
                  className="w-full text-left text-sm px-3 py-2 rounded-xl transition-all"
                  style={isActive
                    ? { background: 'rgba(192,57,43,.1)', color: '#c0392b', fontWeight: 600 }
                    : { color: '#5a5a54' }}
                  onClick={() => {
                    if (isActive) { updateParam('min', null); updateParam('max', null) }
                    else {
                      const p = new URLSearchParams(searchParams.toString())
                      range.min ? p.set('min', range.min) : p.delete('min')
                      range.max ? p.set('max', range.max) : p.delete('max')
                      router.push(`/products?${p.toString()}`)
                    }
                  }}>
                  {range.label}
                </button>
              )
            })}
          </div>
        </div>

      </div>
    </div>
  )
}
