'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Plus, Minus, PackagePlus } from 'lucide-react'
import { formatPrice } from '@/lib/utils'
import { createIncomingPurchase } from '@/lib/actions/incoming'

export interface IncomingProductOption {
  id: string
  name: string
  price: number
  variants: { id: string; size: string }[]
}

/**
 * Registrar una compra en camino en un solo paso: el traje, cuántos vienen
 * de cada talla, cuánto costó cada uno y entre qué fechas llega.
 */
export function AdminIncomingForm({ products }: { products: IncomingProductOption[] }) {
  const router = useRouter()
  const [productId, setProductId] = useState(products[0]?.id ?? '')
  const [qty, setQty] = useState<Record<string, number>>({})
  const [unitCost, setUnitCost] = useState('14500')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [note, setNote] = useState('')
  const [registerExpense, setRegisterExpense] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState<string | null>(null)

  const product = products.find((p) => p.id === productId)
  const units = useMemo(() => Object.values(qty).reduce((s, n) => s + (n || 0), 0), [qty])
  const cost = Number(unitCost) || 0
  const profitEach = product ? product.price - cost : 0

  const setOne = (id: string, n: number) => setQty((q) => ({ ...q, [id]: Math.max(0, Math.min(99, n)) }))

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!product || loading) return
    setError(null)
    setDone(null)
    setLoading(true)
    try {
      const res = await createIncomingPurchase({
        product_id: product.id,
        unit_cost: cost,
        arrives_from: from,
        arrives_to: to || from,
        note,
        register_expense: registerExpense,
        lines: Object.entries(qty).map(([variant_id, quantity]) => ({ variant_id, quantity })),
      })
      if ('error' in res && res.error) {
        setError(res.error)
        return
      }
      setDone(`Listo: ${units} ${units === 1 ? 'traje quedó' : 'trajes quedaron'} en camino y ya se pueden reservar.`)
      setQty({})
      setNote('')
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  const labelCls = 'text-xs font-bold uppercase tracking-widest mb-2 block'
  const labelStyle = { color: 'var(--gray-400)' }

  return (
    <form onSubmit={submit} className="card p-5 space-y-5">
      <div className="flex items-center gap-2">
        <PackagePlus size={18} style={{ color: 'var(--red)' }} />
        <h2 className="font-bold" style={{ color: 'var(--text)' }}>Agregar compra en camino</h2>
      </div>

      <div>
        <label className={labelCls} style={labelStyle}>Traje</label>
        <select value={productId} onChange={(e) => { setProductId(e.target.value); setQty({}) }} className="input-field">
          {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>

      {product && (
        <div>
          <label className={labelCls} style={labelStyle}>¿Cuántos vienen de cada talla?</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {product.variants.map((v) => {
              const n = qty[v.id] ?? 0
              return (
                <div key={v.id} className="flex items-center justify-between rounded-xl px-2 py-1.5"
                  style={{ boxShadow: n > 0 ? 'inset 0 0 0 1.5px var(--red)' : 'inset 0 0 0 1px var(--gray-200)', background: n > 0 ? 'rgba(192,57,43,.04)' : '#fff' }}>
                  <span className="text-sm font-bold tabular-nums pl-1" style={{ color: 'var(--text)' }}>{v.size}</span>
                  <div className="flex items-center">
                    <button type="button" onClick={() => setOne(v.id, n - 1)} aria-label={`Menos talla ${v.size}`}
                      className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ color: 'var(--gray-600)' }}>
                      <Minus size={13} />
                    </button>
                    <span className="w-6 text-center text-sm font-bold tabular-nums">{n}</span>
                    <button type="button" onClick={() => setOne(v.id, n + 1)} aria-label={`Más talla ${v.size}`}
                      className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ color: 'var(--gray-600)' }}>
                      <Plus size={13} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls} style={labelStyle}>Llega desde</label>
          <input type="date" value={from} onChange={(e) => { setFrom(e.target.value); if (!to || to < e.target.value) setTo(e.target.value) }} className="input-field" required />
        </div>
        <div>
          <label className={labelCls} style={labelStyle}>Hasta</label>
          <input type="date" value={to} min={from || undefined} onChange={(e) => setTo(e.target.value)} className="input-field" required />
        </div>
      </div>

      <div>
        <label className={labelCls} style={labelStyle}>Costo por traje</label>
        <input type="number" inputMode="numeric" min={0} value={unitCost} onChange={(e) => setUnitCost(e.target.value)} className="input-field" placeholder="14500" />
        {product && cost > 0 && (
          <p className="text-xs mt-2" style={{ color: profitEach > 0 ? '#15803d' : 'var(--red)' }}>
            Se vende a {formatPrice(product.price)} → ganas {formatPrice(profitEach)} por traje
            {units > 0 && <> · {formatPrice(profitEach * units)} en total</>}
          </p>
        )}
      </div>

      <div>
        <label className={labelCls} style={labelStyle}>Nota (opcional)</label>
        <input value={note} onChange={(e) => setNote(e.target.value)} className="input-field" placeholder="Proveedor, número de pedido..." />
      </div>

      <label className="flex items-start gap-2.5 cursor-pointer">
        <input type="checkbox" checked={registerExpense} onChange={(e) => setRegisterExpense(e.target.checked)} className="mt-0.5" />
        <span className="text-xs" style={{ color: 'var(--gray-600)' }}>
          Registrar la compra en Gastos (inventario){units > 0 && cost > 0 && <> · {formatPrice(units * cost)}</>}
        </span>
      </label>

      {error && <p className="text-sm rounded-lg px-3 py-2" style={{ background: 'rgba(192,57,43,.08)', color: 'var(--red)' }}>{error}</p>}
      {done && <p className="text-sm rounded-lg px-3 py-2" style={{ background: 'rgba(22,163,74,.08)', color: '#15803d' }}>{done}</p>}

      <button type="submit" disabled={loading || units === 0 || !from} className="btn-primary w-full justify-center py-3 disabled:opacity-50">
        {loading ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
        {units > 0 ? `Agregar ${units} en camino` : 'Elige al menos una talla'}
      </button>
    </form>
  )
}
