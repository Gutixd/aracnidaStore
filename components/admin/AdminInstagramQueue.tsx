'use client'

import { useState, useTransition } from 'react'
import { deleteInstagramPost, InstagramPost } from '@/lib/actions/instagram'
import { Trash2, CheckCircle2, Clock, AlertCircle, ExternalLink } from 'lucide-react'

function formatDate(d: string) {
  // Fecha guardada como YYYY-MM-DD; se interpreta local para no correrse un día.
  return new Date(`${d}T12:00:00`).toLocaleDateString('es-CL', {
    weekday: 'long', day: 'numeric', month: 'long',
  })
}

function Row({ post }: { post: InstagramPost }) {
  const [pending, startTransition] = useTransition()
  const [hidden, setHidden] = useState(false)

  if (hidden) return null

  const badge =
    post.status === 'publicado'
      ? { icon: <CheckCircle2 size={12} />, text: 'Publicado', bg: 'rgba(22,163,74,.1)', color: '#15803d' }
      : post.status === 'error'
      ? { icon: <AlertCircle size={12} />, text: 'Error', bg: 'rgba(220,38,38,.1)', color: '#dc2626' }
      : { icon: <Clock size={12} />, text: 'Pendiente', bg: 'var(--gray-100)', color: 'var(--gray-600)' }

  return (
    <div className="flex gap-3 p-3 rounded-xl" style={{ background: 'var(--gray-50)' }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={post.image_url} alt="" className="w-16 h-16 rounded-lg object-cover shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full"
            style={{ background: badge.bg, color: badge.color }}>
            {badge.icon} {badge.text}
          </span>
          <span className="text-xs" style={{ color: 'var(--gray-400)' }}>{formatDate(post.scheduled_for)}</span>
        </div>
        <p className="text-sm line-clamp-2" style={{ color: 'var(--gray-600)' }}>{post.caption}</p>
        {post.status === 'error' && post.error_message && (
          <p className="text-xs mt-1" style={{ color: '#dc2626' }}>{post.error_message}</p>
        )}
        {post.status === 'publicado' && post.ig_media_id && (
          <a
            href={`https://www.instagram.com/p/${post.ig_media_id}/`}
            target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs mt-1 hover:underline"
            style={{ color: 'var(--red)' }}
          >
            Ver en Instagram <ExternalLink size={11} />
          </a>
        )}
      </div>
      {post.status === 'pendiente' && (
        <button
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              const res = await deleteInstagramPost(post.id)
              if (res?.ok) setHidden(true)
            })
          }
          className="self-start p-1.5 rounded-lg hover:opacity-70 shrink-0"
          style={{ color: 'var(--gray-400)' }}
          aria-label="Eliminar"
        >
          <Trash2 size={14} />
        </button>
      )}
    </div>
  )
}

export function AdminInstagramQueue({
  pendientes, publicados, errores,
}: {
  pendientes: InstagramPost[]
  publicados: InstagramPost[]
  errores: InstagramPost[]
}) {
  const total = pendientes.length + publicados.length + errores.length

  if (total === 0) {
    return (
      <div className="card p-10 text-center">
        <p className="font-semibold" style={{ color: 'var(--text)' }}>Sin publicaciones programadas todavía</p>
        <p className="text-sm mt-1" style={{ color: 'var(--gray-400)' }}>Usa el formulario para agregar la primera.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {errores.length > 0 && (
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: '#dc2626' }}>
            Con error ({errores.length})
          </h3>
          <div className="space-y-2">{errores.map((p) => <Row key={p.id} post={p} />)}</div>
        </div>
      )}
      {pendientes.length > 0 && (
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: 'var(--gray-400)' }}>
            Programadas ({pendientes.length})
          </h3>
          <div className="space-y-2">{pendientes.map((p) => <Row key={p.id} post={p} />)}</div>
        </div>
      )}
      {publicados.length > 0 && (
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: 'var(--gray-400)' }}>
            Publicadas ({publicados.length})
          </h3>
          <div className="space-y-2">{publicados.map((p) => <Row key={p.id} post={p} />)}</div>
        </div>
      )}
    </div>
  )
}
