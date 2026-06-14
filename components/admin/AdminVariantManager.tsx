'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { ProductVariant } from '@/types'
import { formatPrice } from '@/lib/utils'
import { Plus, Minus, Check, Loader2 } from 'lucide-react'

interface Props {
  productId: string
  variants: ProductVariant[]
}

export function AdminVariantManager({ productId, variants }: Props) {
  const router = useRouter()
  const [rows, setRows] = useState(() =>
    [...variants].sort((a, b) => {
      const na = parseInt(a.size), nb = parseInt(b.size)
      if (!isNaN(na) && !isNaN(nb)) return na - nb
      return a.size.localeCompare(b.size)
    })
  )
  const [savingId, setSavingId] = useState<string | null>(null)
  const [savedId, setSavedId] = useState<string | null>(null)

  function setStock(id: string, value: number) {
    setRows((r) => r.map((v) => (v.id === id ? { ...v, stock: Math.max(0, value) } : v)))
  }

  async function recalcProduct(supabase: ReturnType<typeof createClient>) {
    const { data: all } = await supabase.from('product_variants').select('stock').eq('product_id', productId)
    const total = (all ?? []).reduce((s, v) => s + v.stock, 0)
    await supabase.from('products').update({ stock: total }).eq('id', productId)
  }

  async function save(variant: ProductVariant) {
    setSavingId(variant.id)
    const supabase = createClient()

    // Stock previo desde DB
    const { data: prev } = await supabase.from('product_variants').select('stock').eq('id', variant.id).single()
    const previousStock = prev?.stock ?? 0
    const newStock = variant.stock
    const diff = newStock - previousStock

    const { error } = await supabase
      .from('product_variants')
      .update({ stock: newStock, updated_at: new Date().toISOString() })
      .eq('id', variant.id)

    if (!error) {
      if (diff !== 0) {
        await supabase.from('inventory_movements').insert({
          product_id: productId,
          variant_id: variant.id,
          type: 'adjust',
          quantity: Math.abs(diff),
          reason: `Ajuste manual talla ${variant.size}`,
          previous_stock: previousStock,
          new_stock: newStock,
          created_by: 'admin',
        })
      }
      await recalcProduct(supabase)
      setSavedId(variant.id)
      setTimeout(() => setSavedId(null), 1500)
      router.refresh()
    }
    setSavingId(null)
  }

  const total = rows.reduce((s, v) => s + v.stock, 0)

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-bold" style={{ color: 'var(--text)' }}>Stock por talla</h2>
        <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: 'rgba(26,39,68,.08)', color: 'var(--blue)' }}>
          Total: {total}
        </span>
      </div>

      <div className="space-y-2">
        {rows.map((v) => (
          <div key={v.id} className="flex items-center gap-3 p-2 rounded-xl" style={{ background: 'var(--gray-50)' }}>
            <div className="w-14 shrink-0">
              <p className="text-sm font-bold" style={{ color: 'var(--text)' }}>{v.size}</p>
              <p className="text-[10px]" style={{ color: 'var(--gray-400)' }}>{formatPrice(v.price)}</p>
            </div>

            <div className="flex items-center gap-1 rounded-lg p-0.5 ml-auto" style={{ background: '#fff', border: '1px solid var(--gray-200)' }}>
              <button onClick={() => setStock(v.id, v.stock - 1)} className="w-7 h-7 rounded-md flex items-center justify-center" style={{ color: 'var(--gray-600)' }} aria-label="Restar">
                <Minus size={13} />
              </button>
              <input
                type="number"
                value={v.stock}
                onChange={(e) => setStock(v.id, parseInt(e.target.value) || 0)}
                className="w-12 text-center text-sm font-bold bg-transparent outline-none tabular-nums"
                style={{ color: 'var(--text)' }}
              />
              <button onClick={() => setStock(v.id, v.stock + 1)} className="w-7 h-7 rounded-md flex items-center justify-center" style={{ color: 'var(--gray-600)' }} aria-label="Sumar">
                <Plus size={13} />
              </button>
            </div>

            <button
              onClick={() => save(v)}
              disabled={savingId === v.id}
              className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-all"
              style={savedId === v.id ? { background: '#16a34a', color: '#fff' } : { background: 'var(--red)', color: '#fff' }}
              aria-label="Guardar"
            >
              {savingId === v.id ? <Loader2 size={15} className="animate-spin" /> : savedId === v.id ? <Check size={15} strokeWidth={3} /> : <Check size={15} />}
            </button>
          </div>
        ))}
      </div>
      <p className="text-xs mt-4" style={{ color: 'var(--gray-400)' }}>
        Edita el stock de cada talla y presiona el check para guardar. Cada cambio queda registrado en el inventario.
      </p>
    </div>
  )
}
