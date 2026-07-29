import { createAdminClient } from '@/lib/supabase/server'
import { AdminReviewActions } from '@/components/admin/AdminReviewActions'
import { Star, MessageSquare, CheckCircle2, Clock } from 'lucide-react'

export const dynamic = 'force-dynamic'

interface AdminReview {
  id: string
  customer_name: string
  rating: number
  comment: string
  approved: boolean
  verified: boolean
  created_at: string
  product: { name: string; slug: string } | null
}

async function getReviews(): Promise<AdminReview[]> {
  const supabase = await createAdminClient()
  const { data } = await supabase
    .from('reviews')
    .select('id, customer_name, rating, comment, approved, verified, created_at, product:products(name, slug)')
    .order('created_at', { ascending: false })
  return (data ?? []) as unknown as AdminReview[]
}

export default async function AdminReviewsPage() {
  const reviews = await getReviews()
  const pending = reviews.filter((r) => !r.approved)
  const published = reviews.filter((r) => r.approved)

  function Card({ r }: { r: AdminReview }) {
    return (
      <div className="card p-5">
        <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <p className="font-bold" style={{ color: 'var(--text)' }}>{r.customer_name}</p>
              {r.verified && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full"
                  style={{ background: 'rgba(22,163,74,.1)', color: '#15803d' }}>
                  <CheckCircle2 size={11} /> Compra verificada
                </span>
              )}
            </div>
            <p className="text-xs" style={{ color: 'var(--gray-400)' }}>
              {r.product?.name ?? 'Producto eliminado'} ·{' '}
              {new Date(r.created_at).toLocaleDateString('es-CL')}
            </p>
          </div>
          <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map((i) => (
              <Star key={i} size={14}
                fill={i <= r.rating ? '#f59e0b' : 'none'}
                stroke={i <= r.rating ? 'none' : '#d4d4d4'} />
            ))}
          </div>
        </div>
        <p className="text-sm mb-4 leading-relaxed" style={{ color: 'var(--gray-600)' }}>
          {r.comment}
        </p>
        <AdminReviewActions reviewId={r.id} approved={r.approved} />
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-black" style={{ color: 'var(--text)' }}>Reseñas</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--gray-600)' }}>
          Solo se publican las que apruebes. Las reseñas reales mejoran el posicionamiento en Google.
        </p>
      </div>

      {reviews.length === 0 && (
        <div className="card p-16 text-center" style={{ color: 'var(--gray-400)' }}>
          <MessageSquare size={40} className="mx-auto mb-4" />
          <p className="mb-1">Aún no hay reseñas</p>
          <p className="text-sm">
            Cada comprobante que enviamos por correo invita al cliente a dejar la suya.
          </p>
        </div>
      )}

      {pending.length > 0 && (
        <section className="mb-10">
          <h2 className="text-sm font-bold uppercase tracking-wider mb-4 flex items-center gap-2"
            style={{ color: '#b45309' }}>
            <Clock size={15} /> Pendientes de aprobar ({pending.length})
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {pending.map((r) => <Card key={r.id} r={r} />)}
          </div>
        </section>
      )}

      {published.length > 0 && (
        <section>
          <h2 className="text-sm font-bold uppercase tracking-wider mb-4 flex items-center gap-2"
            style={{ color: '#15803d' }}>
            <CheckCircle2 size={15} /> Publicadas ({published.length})
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {published.map((r) => <Card key={r.id} r={r} />)}
          </div>
        </section>
      )}
    </div>
  )
}
