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

  const inputClass = "w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-red-600/50"

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div>
        <label className="block text-xs text-white/50 mb-1">Descripción *</label>
        <input value={form.title} onChange={(e) => update('title', e.target.value)} className={inputClass} placeholder="Ej: Compra 5 trajes..." />
      </div>
      <div>
        <label className="block text-xs text-white/50 mb-1">Monto (CLP) *</label>
        <input value={form.amount} onChange={(e) => update('amount', e.target.value)} type="number" className={inputClass} placeholder="25000" />
      </div>
      <div>
        <label className="block text-xs text-white/50 mb-1">Categoría</label>
        <select value={form.category} onChange={(e) => update('category', e.target.value)} className={`${inputClass} bg-[#0d1117]`}>
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value} className="bg-[#0d1117]">{c.label}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-xs text-white/50 mb-1">Nota (opcional)</label>
        <input value={form.note} onChange={(e) => update('note', e.target.value)} className={inputClass} placeholder="Proveedor, detalle..." />
      </div>
      {error && <p className="text-red-400 text-xs">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-white text-sm disabled:opacity-60 transition-all"
        style={{ background: success ? 'linear-gradient(135deg, #16a34a, #15803d)' : 'linear-gradient(135deg, #c0392b, #a93226)' }}
      >
        {loading ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
        {success ? '¡Registrado!' : 'Registrar gasto'}
      </button>
    </form>
  )
}
