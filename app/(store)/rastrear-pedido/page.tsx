'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { findOrderByCode } from '@/lib/actions/trackOrder'
import { Search, Loader2, AlertCircle } from 'lucide-react'

export default function TrackOrderPage() {
  const [code, setCode] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const res = await findOrderByCode(code, email)
    if (res.error) {
      setError(res.error)
      setLoading(false)
      return
    }

    router.push(`/order-success/${res.orderId}`)
  }

  return (
    <div style={{ background: 'var(--gray-50)', minHeight: '100vh' }}
      className="flex items-center justify-center px-4 pt-24 pb-16">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
            style={{ background: 'rgba(192,57,43,.1)' }}>
            <Search size={26} style={{ color: 'var(--red)' }} />
          </div>
          <h1 className="text-2xl font-black" style={{ color: 'var(--text)' }}>Rastrea tu pedido</h1>
          <p className="mt-2 text-sm" style={{ color: 'var(--gray-600)' }}>
            Ingresa el código de tu pedido y el email con el que compraste
          </p>
        </div>

        <form onSubmit={handleSubmit} className="card p-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--gray-600)' }}>
              Código de pedido *
            </label>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Ej: AAFA5EA9"
              required
              className="input-field font-mono uppercase"
            />
            <p className="text-xs mt-1" style={{ color: 'var(--gray-400)' }}>
              Lo encuentras en el correo o mensaje de confirmación de tu compra
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--gray-600)' }}>
              Email de la compra *
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              required
              className="input-field"
            />
          </div>

          {error && (
            <div className="rounded-xl p-3 text-sm flex items-start gap-2"
              style={{ background: 'rgba(192,57,43,.1)', border: '1px solid rgba(192,57,43,.3)', color: 'var(--red)' }}>
              <AlertCircle size={15} className="shrink-0 mt-0.5" /> {error}
            </div>
          )}

          <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3.5">
            {loading ? <><Loader2 size={16} className="animate-spin" /> Buscando…</> : 'Ver estado del pedido'}
          </button>
        </form>

        <p className="text-center text-sm mt-6" style={{ color: 'var(--gray-400)' }}>
          ¿No encuentras tu código?{' '}
          <a
            href={`https://wa.me/56978829942?text=${encodeURIComponent('Hola! Necesito ayuda para encontrar mi pedido')}`}
            className="font-semibold underline"
            style={{ color: 'var(--red)' }}
          >
            Escríbenos por WhatsApp
          </a>
        </p>
      </div>
    </div>
  )
}
