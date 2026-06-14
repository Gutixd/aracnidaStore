'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Plus, Loader2 } from 'lucide-react'

const CATEGORIES = [
  { value: 'inventario', label: 'Inventario' },
  { value: 'envio', label: 'Envío' },
  { value: 'operacion', label: 'Operación' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'otro', label: 'Otro' },
]

export function AdminExpenseForm() {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({ title: '', amount: '', category: 'otro', note: '' })
  const router = useRouter()

  function update(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title || !form.amount) { setError('Completa los campos requeridos'); return }
    const amount = parseFloat(form.amount)
    if (isNaN(amount) || amount <= 0) { setError('Monto inválido'); return }
    setLoading(true)
    setError(null)
    const supabase = createClient()
    await supabase.from('expenses').insert({ ...form, amount })
    setForm({ title: '', amount: '', category: 'otro', note: '' })
    setSuccess(true)
    setTimeout(() => setSuccess(false), 2000)
    setLoading(false)
    router.refresh()
  }

  const labelCls = "block text-xs font-semibold mb-1"
  const labelStyle = { color: 'var(--gray-600)' }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div>
        <label className={labelCls} style={labelStyle}>Descripción *</label>
        <input value={form.title} onChange={(e) => update('title', e.target.value)} className="input-field" placeholder="Ej: Compra 5 trajes..." />
      </div>
      <div>
        <label className={labelCls} style={labelStyle}>Monto (CLP) *</label>
        <input value={form.amount} onChange={(e) => update('amount', e.target.value)} type="number" className="input-field" placeholder="25000" />
      </div>
      <div>
        <label className={labelCls} style={labelStyle}>Categoría</label>
        <select value={form.category} onChange={(e) => update('category', e.target.value)} className="input-field">
          {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
      </div>
      <div>
        <label className={labelCls} style={labelStyle}>Nota (opcional)</label>
        <input value={form.note} onChange={(e) => update('note', e.target.value)} className="input-field" placeholder="Proveedor, detalle..." />
      </div>
      {error && <p className="text-xs" style={{ color: 'var(--red)' }}>{error}</p>}
      <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-2.5 text-sm"
        style={success ? { background: '#16a34a' } : undefined}>
        {loading ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
        {success ? '¡Registrado!' : 'Registrar gasto'}
      </button>
    </form>
  )
}
