'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Save, Loader2 } from 'lucide-react'

interface Props {
  settings: {
    id: string
    store_name: string
    shipping_cost: number
    free_shipping_threshold: number
    contact_email: string
    instagram_url: string
    tiktok_url: string
    address: string
    low_stock_threshold: number
  } | null
}

export function AdminSettingsForm({ settings }: Props) {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const router = useRouter()

  const [form, setForm] = useState({
    store_name: settings?.store_name ?? 'AracnidaStore',
    shipping_cost: settings?.shipping_cost ?? 3000,
    free_shipping_threshold: settings?.free_shipping_threshold ?? 50000,
    contact_email: settings?.contact_email ?? '',
    instagram_url: settings?.instagram_url ?? '',
    tiktok_url: settings?.tiktok_url ?? '',
    address: settings?.address ?? '',
    low_stock_threshold: settings?.low_stock_threshold ?? 3,
  })

  function update(key: string, value: string | number) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSave() {
    setLoading(true)
    setMessage(null)
    const supabase = createClient()

    if (settings?.id) {
      await supabase.from('settings').update({ ...form, updated_at: new Date().toISOString() }).eq('id', settings.id)
    } else {
      await supabase.from('settings').insert(form)
    }

    setMessage('Configuración guardada correctamente')
    setLoading(false)
    router.refresh()
    setTimeout(() => setMessage(null), 3000)
  }

  const inputClass = "input-field"
  const labelClass = "block text-sm font-semibold mb-1.5"
  const labelStyle = { color: 'var(--gray-600)' }
  const sectionTitle = "text-sm font-bold uppercase tracking-wider mb-4"
  const sectionStyle = { color: 'var(--gray-400)' }

  return (
    <div className="card p-6 space-y-6">
      <section>
        <h2 className={sectionTitle} style={sectionStyle}>General</h2>
        <div className="space-y-4">
          <div>
            <label className={labelClass}>Nombre de la tienda</label>
            <input value={form.store_name} onChange={(e) => update('store_name', e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Email de contacto</label>
            <input value={form.contact_email} onChange={(e) => update('contact_email', e.target.value)} type="email" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Dirección física</label>
            <input value={form.address} onChange={(e) => update('address', e.target.value)} className={inputClass} placeholder="Santiago, Chile" />
          </div>
        </div>
      </section>

      <section className="pt-6" style={{ borderTop: '1px solid var(--gray-100)' }}>
        <h2 className={sectionTitle} style={sectionStyle}>Envíos</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Costo de envío (CLP)</label>
            <input
              value={form.shipping_cost}
              onChange={(e) => update('shipping_cost', parseInt(e.target.value) || 0)}
              type="number"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Envío gratis desde (CLP)</label>
            <input
              value={form.free_shipping_threshold}
              onChange={(e) => update('free_shipping_threshold', parseInt(e.target.value) || 0)}
              type="number"
              className={inputClass}
            />
          </div>
        </div>
      </section>

      <section className="pt-6" style={{ borderTop: '1px solid var(--gray-100)' }}>
        <h2 className={sectionTitle} style={sectionStyle}>Alertas</h2>
        <div>
          <label className={labelClass}>Umbral de stock bajo (unidades)</label>
          <input
            value={form.low_stock_threshold}
            onChange={(e) => update('low_stock_threshold', parseInt(e.target.value) || 3)}
            type="number"
            className={inputClass}
          />
          <p className="text-xs mt-1" style={{ color: 'var(--gray-400)' }}>
            Recibirás alertas cuando el stock sea igual o menor a este valor
          </p>
        </div>
      </section>

      <section className="pt-6" style={{ borderTop: '1px solid var(--gray-100)' }}>
        <h2 className={sectionTitle} style={sectionStyle}>Redes sociales</h2>
        <div className="space-y-4">
          <div>
            <label className={labelClass}>Instagram URL</label>
            <input value={form.instagram_url} onChange={(e) => update('instagram_url', e.target.value)} className={inputClass} placeholder="https://instagram.com/..." />
          </div>
          <div>
            <label className={labelClass}>TikTok URL</label>
            <input value={form.tiktok_url} onChange={(e) => update('tiktok_url', e.target.value)} className={inputClass} placeholder="https://tiktok.com/@..." />
          </div>
        </div>
      </section>

      {message && (
        <div className="rounded-xl p-3 text-sm" style={{ background: 'rgba(22,163,74,.1)', border: '1px solid rgba(22,163,74,.3)', color: '#15803d' }}>
          {message}
        </div>
      )}

      <button onClick={handleSave} disabled={loading} className="btn-primary text-sm">
        {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
        {loading ? 'Guardando...' : 'Guardar configuración'}
      </button>
    </div>
  )
}
