'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { moderateReview, deleteReview } from '@/lib/actions/reviews'
import { Check, X, Trash2, Loader2 } from 'lucide-react'

interface Props {
  reviewId: string
  approved: boolean
}

export function AdminReviewActions({ reviewId, approved }: Props) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function run(fn: () => Promise<{ error?: string } | undefined>) {
    setLoading(true)
    const res = await fn()
    setLoading(false)
    if (res?.error) { alert(res.error); return }
    router.refresh()
  }

  if (loading) {
    return <Loader2 size={16} className="animate-spin" style={{ color: 'var(--gray-400)' }} />
  }

  return (
    <div className="flex items-center gap-2">
      {approved ? (
        <button
          onClick={() => run(() => moderateReview(reviewId, false))}
          className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border"
          style={{ borderColor: 'var(--gray-200)', color: 'var(--gray-600)' }}
        >
          <X size={13} /> Ocultar
        </button>
      ) : (
        <button
          onClick={() => run(() => moderateReview(reviewId, true))}
          className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg text-white"
          style={{ background: '#16a34a' }}
        >
          <Check size={13} /> Aprobar
        </button>
      )}
      <button
        onClick={() => {
          if (confirm('¿Eliminar esta reseña definitivamente?')) run(() => deleteReview(reviewId))
        }}
        aria-label="Eliminar reseña"
        className="p-1.5 rounded-lg border"
        style={{ borderColor: 'var(--gray-200)', color: 'var(--gray-400)' }}
      >
        <Trash2 size={13} />
      </button>
    </div>
  )
}
