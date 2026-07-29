'use client'

import { useState } from 'react'
import { Star, CheckCircle2, Loader2, MessageSquare } from 'lucide-react'
import { submitReview } from '@/lib/actions/reviews'

interface Review {
  id: string
  customer_name: string
  rating: number
  comment: string
  verified: boolean
  created_at: string
}

interface Props {
  productId: string
  productName: string
  reviews: Review[]
  average: number
  count: number
}

function Stars({ value, size = 15 }: { value: number; size?: number }) {
  return (
    <div className="flex gap-0.5" role="img" aria-label={`${value} de 5 estrellas`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={size}
          fill={i <= Math.round(value) ? '#f59e0b' : 'none'}
          stroke={i <= Math.round(value) ? 'none' : '#d4d4d4'}
        />
      ))}
    </div>
  )
}

export function ProductReviews({ productId, productName, reviews, average, count }: Props) {
  const [open, setOpen] = useState(false)
  const [rating, setRating] = useState(0)
  const [hover, setHover] = useState(0)
  const [name, setName] = useState('')
  const [comment, setComment] = useState('')
  const [orderId, setOrderId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const res = await submitReview({
      productId,
      orderId: orderId.trim() || undefined,
      customerName: name,
      rating,
      comment,
    })

    setLoading(false)
    if (res.error) { setError(res.error); return }
    setDone(true)
  }

  return (
    <section className="mt-16" id="resenas">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--gray-400)' }}>
            Opiniones
          </p>
          <h2 className="text-2xl font-black" style={{ color: 'var(--text)' }}>
            Reseñas de clientes
          </h2>
          {count > 0 ? (
            <div className="flex items-center gap-2 mt-2">
              <Stars value={average} size={17} />
              <span className="font-bold" style={{ color: 'var(--text)' }}>{average.toFixed(1)}</span>
              <span className="text-sm" style={{ color: 'var(--gray-400)' }}>
                · {count} {count === 1 ? 'reseña' : 'reseñas'}
              </span>
            </div>
          ) : (
            <p className="text-sm mt-2" style={{ color: 'var(--gray-400)' }}>
              Aún no hay reseñas de este producto. ¡Sé el primero en opinar!
            </p>
          )}
        </div>

        {!open && !done && (
          <button onClick={() => setOpen(true)} className="btn-ghost px-5 py-2.5 text-sm">
            <MessageSquare size={15} /> Escribir reseña
          </button>
        )}
      </div>

      {done && (
        <div className="rounded-2xl p-4 mb-6 text-sm"
          style={{ background: 'rgba(22,163,74,.08)', border: '1px solid rgba(22,163,74,.3)', color: '#15803d' }}>
          <strong>¡Gracias por tu reseña!</strong> La revisaremos y se publicará dentro de las próximas horas.
        </div>
      )}

      {open && !done && (
        <form onSubmit={handleSubmit} className="card p-6 mb-8 space-y-4">
          <p className="font-bold" style={{ color: 'var(--text)' }}>
            Tu opinión sobre {productName}
          </p>

          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--gray-600)' }}>
              Tu calificación *
            </label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setRating(i)}
                  onMouseEnter={() => setHover(i)}
                  onMouseLeave={() => setHover(0)}
                  aria-label={`${i} estrellas`}
                  className="p-1 transition-transform hover:scale-110"
                >
                  <Star
                    size={26}
                    fill={i <= (hover || rating) ? '#f59e0b' : 'none'}
                    stroke={i <= (hover || rating) ? 'none' : '#d4d4d4'}
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--gray-600)' }}>
                Tu nombre *
              </label>
              <input value={name} onChange={(e) => setName(e.target.value)}
                placeholder="Ej: Camila R." className="input-field" maxLength={60} />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--gray-600)' }}>
                N° de pedido <span style={{ color: 'var(--gray-400)' }}>(opcional)</span>
              </label>
              <input value={orderId} onChange={(e) => setOrderId(e.target.value)}
                placeholder="Para mostrar tu compra verificada" className="input-field" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--gray-600)' }}>
              Tu comentario *
            </label>
            <textarea value={comment} onChange={(e) => setComment(e.target.value)}
              rows={4} maxLength={1000} className="input-field"
              placeholder="¿Qué te pareció la calidad, la talla y la entrega?" />
          </div>

          {error && (
            <p className="text-sm rounded-xl p-3"
              style={{ background: 'rgba(192,57,43,.1)', color: 'var(--red)' }}>{error}</p>
          )}

          <div className="flex gap-3">
            <button type="submit" disabled={loading} className="btn-primary px-6 py-3">
              {loading ? <><Loader2 size={16} className="animate-spin" /> Enviando…</> : 'Enviar reseña'}
            </button>
            <button type="button" onClick={() => setOpen(false)} className="btn-ghost px-5 py-3">
              Cancelar
            </button>
          </div>
          <p className="text-xs" style={{ color: 'var(--gray-400)' }}>
            Las reseñas se revisan antes de publicarse. Solo publicamos opiniones de personas que compraron.
          </p>
        </form>
      )}

      {reviews.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {reviews.map((r) => (
            <article key={r.id} className="card p-5">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <p className="font-bold text-sm" style={{ color: 'var(--text)' }}>{r.customer_name}</p>
                  {r.verified && (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold mt-0.5"
                      style={{ color: '#15803d' }}>
                      <CheckCircle2 size={12} /> Compra verificada
                    </span>
                  )}
                </div>
                <time className="text-xs shrink-0" style={{ color: 'var(--gray-400)' }}
                  dateTime={r.created_at}>
                  {new Date(r.created_at).toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' })}
                </time>
              </div>
              <Stars value={r.rating} />
              <p className="text-sm mt-2.5 leading-relaxed" style={{ color: 'var(--gray-600)' }}>
                {r.comment}
              </p>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
