'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { slugify } from '@/lib/utils'
import { Loader2, Save } from 'lucide-react'

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
    if (!form.name || !form.description || !form.price || !form.category_id || !form.color) {
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

      if (error) setMessage({ type: 'error', text: 'Error al guardar: ' + error.message })
      else { setMessage({ type: 'success', text: 'Producto actualizado correctamente' }); router.refresh() }
    } else {
      const slug = `${slugify(form.name)}-${Date.now().toString().slice(-5)}`
      const sku = `PRD-${Date.now().toString().slice(-6)}`
      const stock = parseInt(form.stock) || 0

      const { data: created, error } = await supabase
        .from('products')
        .insert({ ...data, slug, sku, size: 'Única', stock })
        .select()
        .single()

      if (error || !created) {
        setMessage({ type: 'error', text: 'Error al crear: ' + (error?.message ?? '') })
      } else {
        // Crear variante Única por defecto
        await supabase.from('product_variants').insert({
          product_id: created.id, size: 'Única', stock, price: data.price, cost_price: data.cost_price, sku: sku + '-U',
        })
        setMessage({ type: 'success', text: 'Producto creado. Edítalo para gestionar tallas.' })
        setTimeout(() => router.push(`/admin/products/${created.id}`), 800)
      }
    }
    setLoading(false)
  }

  const labelClass = "block text-sm font-semibold mb-1.5"
  const labelStyle = { color: 'var(--gray-600)' }

  return (
    <form onSubmit={onSubmit} className="card p-6 space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label className={labelClass} style={labelStyle}>Nombre del producto *</label>
          <input value={form.name} onChange={(e) => update('name', e.target.value)} className="input-field" placeholder="Disfraz Spider-Man..." />
        </div>

        <div className="sm:col-span-2">
          <label className={labelClass} style={labelStyle}>Descripción *</label>
          <textarea value={form.description} onChange={(e) => update('description', e.target.value)} rows={4} className="input-field resize-none" placeholder="Descripción detallada..." />
        </div>

        <div>
          <label className={labelClass} style={labelStyle}>Precio base (CLP) *</label>
          <input value={form.price} onChange={(e) => update('price', e.target.value)} type="number" className="input-field" placeholder="24990" />
        </div>

        <div>
          <label className={labelClass} style={labelStyle}>Costo (CLP)</label>
          <input value={form.cost_price} onChange={(e) => update('cost_price', e.target.value)} type="number" className="input-field" placeholder="9000" />
        </div>

        {!product && (
          <div>
            <label className={labelClass} style={labelStyle}>Stock inicial</label>
            <input value={form.stock} onChange={(e) => update('stock', e.target.value)} type="number" className="input-field" placeholder="10" />
          </div>
        )}

        <div>
          <label className={labelClass} style={labelStyle}>Categoría *</label>
          <select value={form.category_id} onChange={(e) => update('category_id', e.target.value)} className="input-field">
            <option value="">Seleccionar...</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        <div>
          <label className={labelClass} style={labelStyle}>Color *</label>
          <input value={form.color} onChange={(e) => update('color', e.target.value)} className="input-field" placeholder="Rojo/Azul" />
        </div>

        <div className="sm:col-span-2">
          <label className={labelClass} style={labelStyle}>URL de imagen</label>
          <input value={form.image_url} onChange={(e) => update('image_url', e.target.value)} className="input-field" placeholder="https://..." />
        </div>

        <div className="flex items-center gap-6 sm:col-span-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.active} onChange={(e) => update('active', e.target.checked)} className="w-4 h-4 accent-red-600" />
            <span className="text-sm" style={{ color: 'var(--gray-600)' }}>Activo</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.featured} onChange={(e) => update('featured', e.target.checked)} className="w-4 h-4 accent-red-600" />
            <span className="text-sm" style={{ color: 'var(--gray-600)' }}>Destacado</span>
          </label>
        </div>
      </div>

      {product && (
        <p className="text-xs" style={{ color: 'var(--gray-400)' }}>
          Las tallas y su stock se gestionan en el panel "Stock por talla" de la derecha.
        </p>
      )}

      {message && (
        <div className="p-3 rounded-xl text-sm"
          style={message.type === 'success'
            ? { background: 'rgba(22,163,74,.1)', border: '1px solid rgba(22,163,74,.3)', color: '#15803d' }
            : { background: 'rgba(192,57,43,.1)', border: '1px solid rgba(192,57,43,.3)', color: 'var(--red)' }}>
          {message.text}
        </div>
      )}

      <button type="submit" disabled={loading} className="btn-primary text-sm">
        {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
        {loading ? 'Guardando...' : 'Guardar producto'}
      </button>
    </form>
  )
}
