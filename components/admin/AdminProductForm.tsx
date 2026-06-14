'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { slugify } from '@/lib/utils'
import { Loader2, Save } from 'lucide-react'

const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Única']

interface Props {
  product: { id: string; [key: string]: unknown } | null
  categories: { id: string; name: string }[]
}

export function AdminProductForm({ product, categories }: Props) {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const router = useRouter()

  const [form, setForm] = useState({
    name: (product?.name as string) ?? '',
    description: (product?.description as string) ?? '',
    price: String(product?.price ?? ''),
    cost_price: String(product?.cost_price ?? ''),
    stock: String(product?.stock ?? '0'),
    size: (product?.size as string) ?? '',
    color: (product?.color as string) ?? '',
    category_id: (product?.category_id as string) ?? '',
    image_url: (product?.image_url as string) ?? '',
    active: (product?.active as boolean) ?? true,
    featured: (product?.featured as boolean) ?? false,
  })

  function update(key: string, value: string | boolean) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name || !form.description || !form.price || !form.category_id || !form.size || !form.color) {
      setMessage({ type: 'error', text: 'Completa todos los campos requeridos' })
      return
    }

    setLoading(true)
    setMessage(null)
    const supabase = createClient()

    const data = {
      name: form.name,
      description: form.description,
      price: parseFloat(form.price),
      cost_price: parseFloat(form.cost_price) || 0,
      stock: parseInt(form.stock) || 0,
      size: form.size,
      color: form.color,
      category_id: form.category_id,
      image_url: form.image_url,
      active: form.active,
      featured: form.featured,
    }

    if (product) {
      const { error } = await supabase
        .from('products')
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq('id', product.id)

      if (error) {
        setMessage({ type: 'error', text: 'Error al guardar: ' + error.message })
      } else {
        setMessage({ type: 'success', text: 'Producto actualizado correctamente' })
        router.refresh()
      }
    } else {
      const slug = `${slugify(form.name)}-${Date.now()}`
      const sku = `PRD-${form.size.toUpperCase()}-${Date.now().toString().slice(-6)}`

      const { error } = await supabase.from('products').insert({ ...data, slug, sku })

      if (error) {
        setMessage({ type: 'error', text: 'Error al crear: ' + error.message })
      } else {
        setMessage({ type: 'success', text: 'Producto creado correctamente' })
        setTimeout(() => router.push('/admin/products'), 1000)
      }
    }

    setLoading(false)
  }

  const inputClass = "w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder:text-white/20 focus:outline-none focus:border-red-600/50 transition-all text-sm"
  const labelClass = "block text-sm font-medium text-white/60 mb-1.5"

  return (
    <form onSubmit={onSubmit} className="bg-[#111827] border border-white/5 rounded-xl p-6 space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label className={labelClass}>Nombre del producto *</label>
          <input value={form.name} onChange={(e) => update('name', e.target.value)} className={inputClass} placeholder="Traje Spider-Man..." />
        </div>

        <div className="sm:col-span-2">
          <label className={labelClass}>Descripción *</label>
          <textarea
            value={form.description}
            onChange={(e) => update('description', e.target.value)}
            rows={4}
            className={`${inputClass} resize-none`}
            placeholder="Descripción detallada del producto..."
          />
        </div>

        <div>
          <label className={labelClass}>Precio de venta (CLP) *</label>
          <input value={form.price} onChange={(e) => update('price', e.target.value)} type="number" className={inputClass} placeholder="49900" />
        </div>

        <div>
          <label className={labelClass}>Costo real (CLP)</label>
          <input value={form.cost_price} onChange={(e) => update('cost_price', e.target.value)} type="number" className={inputClass} placeholder="18000" />
        </div>

        <div>
          <label className={labelClass}>Stock inicial</label>
          <input value={form.stock} onChange={(e) => update('stock', e.target.value)} type="number" className={inputClass} placeholder="10" />
        </div>

        <div>
          <label className={labelClass}>Categoría *</label>
          <select value={form.category_id} onChange={(e) => update('category_id', e.target.value)} className={`${inputClass} bg-[#0d1117]`}>
            <option value="">Seleccionar...</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id} className="bg-[#0d1117]">{c.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelClass}>Talla *</label>
          <select value={form.size} onChange={(e) => update('size', e.target.value)} className={`${inputClass} bg-[#0d1117]`}>
            <option value="">Seleccionar...</option>
            {SIZES.map((s) => (
              <option key={s} value={s} className="bg-[#0d1117]">{s}</option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelClass}>Color *</label>
          <input value={form.color} onChange={(e) => update('color', e.target.value)} className={inputClass} placeholder="Rojo/Azul" />
        </div>

        <div className="sm:col-span-2">
          <label className={labelClass}>URL de imagen</label>
          <input value={form.image_url} onChange={(e) => update('image_url', e.target.value)} className={inputClass} placeholder="https://..." />
        </div>

        <div className="flex items-center gap-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.active} onChange={(e) => update('active', e.target.checked)} className="w-4 h-4 accent-red-600" />
            <span className="text-sm text-white/60">Activo</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.featured} onChange={(e) => update('featured', e.target.checked)} className="w-4 h-4 accent-red-600" />
            <span className="text-sm text-white/60">Destacado</span>
          </label>
        </div>
      </div>

      {message && (
        <div className={`p-3 rounded-lg text-sm ${
          message.type === 'success'
            ? 'bg-green-900/20 border border-green-800/30 text-green-400'
            : 'bg-red-900/20 border border-red-800/30 text-red-400'
        }`}>
          {message.text}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-white text-sm disabled:opacity-60 transition-all"
        style={{ background: 'linear-gradient(135deg, #c0392b, #a93226)' }}
      >
        {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
        {loading ? 'Guardando...' : 'Guardar producto'}
      </button>
    </form>
  )
}
