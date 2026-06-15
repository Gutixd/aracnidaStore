'use client'

import { Category } from '@/types'
import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useRef, useState, useTransition } from 'react'
import { Search, X, Loader2, SlidersHorizontal, ChevronDown } from 'lucide-react'

interface ProductFiltersProps {
  categories: Category[]
  currentParams: Record<string, string | undefined>
}

const SIZES = ['100','110','120','130','140','150','160','170','180','190','Única']

export function ProductFilters({ categories, currentParams }: ProductFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  // Navegación suave: sin salto de scroll, sin llenar el historial, sin congelar la UI
  const navigate = useCallback(
    (params: URLSearchParams) => {
      const qs = params.toString()
      startTransition(() => {
        router.replace(qs ? `/products?${qs}` : '/products', { scroll: false })
      })
    },
    [router]
  )

  const updateParam = useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value) params.set(key, value)
      else params.delete(key)
      navigate(params)
    },
    [navigate, searchParams]
  )

  // Búsqueda con debounce para no navegar en cada tecla
  const [searchText, setSearchText] = useState(currentParams.search ?? '')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    // Mantener sincronizado si se limpian los filtros desde fuera
    setSearchText(currentParams.search ?? '')
  }, [currentParams.search])

  const onSearchChange = (value: string) => {
    setSearchText(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      updateParam('search', value.trim() || null)
    }, 350)
  }

  const clearAll = () => {
    setSearchText('')
    navigate(new URLSearchParams())
  }
  const hasFilters = Object.values(currentParams).some(Boolean)
  const activeCount = Object.entries(currentParams).filter(
    ([k, v]) => v && !(k === 'sort' && v === 'newest')
  ).length

  // Panel colapsable en celular (abierto siempre en desktop)
  const [open, setOpen] = useState(false)

  const filterLabel = 'text-sm font-semibold uppercase tracking-widest mb-3 block'
  const filterStyle = { color: '#9b9b93', fontSize: '11px' }

  return (
    <div className="space-y-3 lg:sticky lg:top-24">
      {/* Botón de filtros (solo celular) */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="lg:hidden w-full card flex items-center justify-between px-5 py-3.5"
        aria-expanded={open}
      >
        <span className="flex items-center gap-2 text-sm font-bold" style={{ color: '#1a1a18' }}>
          <SlidersHorizontal size={16} style={{ color: '#c0392b' }} />
          Filtros
          {activeCount > 0 && (
            <span className="ml-1 text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: '#c0392b', color: '#fff' }}>
              {activeCount}
            </span>
          )}
        </span>
        <ChevronDown size={18} className="transition-transform" style={{ color: '#9b9b93', transform: open ? 'rotate(180deg)' : 'none' }} />
      </button>

      <div
        className={`${open ? 'block' : 'hidden'} lg:block card p-5 space-y-6 relative transition-opacity duration-200`}
        style={{ opacity: isPending ? 0.6 : 1 }}
        aria-busy={isPending}
      >
        {/* Barra de progreso superior mientras carga */}
        {isPending && (
          <span
            className="absolute top-0 left-0 right-0 h-0.5 overflow-hidden rounded-t-2xl"
            style={{ background: 'rgba(192,57,43,.15)' }}
          >
            <span className="filter-progress" />
          </span>
        )}

        {/* Header (solo desktop, en celular ya está el botón) */}
        <div className="hidden lg:flex items-center justify-between">
          <span className="text-sm font-bold" style={{ color: '#1a1a18' }}>Filtros</span>
          {isPending && <Loader2 size={14} className="animate-spin" style={{ color: '#c0392b' }} />}
        </div>

        {/* Search */}
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#9b9b93' }} />
          <input
            type="text"
            placeholder="Buscar..."
            value={searchText}
            onChange={(e) => onSearchChange(e.target.value)}
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
                    const p = new URLSearchParams(searchParams.toString())
                    if (isActive) { p.delete('min'); p.delete('max') }
                    else {
                      range.min ? p.set('min', range.min) : p.delete('min')
                      range.max ? p.set('max', range.max) : p.delete('max')
                    }
                    navigate(p)
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
