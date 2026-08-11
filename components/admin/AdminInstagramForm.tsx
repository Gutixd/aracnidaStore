'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { scheduleInstagramPost } from '@/lib/actions/instagram'
import { Upload, Loader2, CalendarDays } from 'lucide-react'

function todayISO() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function fileToBase64(file: File): Promise<{ base64: string; type: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      resolve({ base64: result.split(',')[1], type: file.type })
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export function AdminInstagramForm() {
  const router = useRouter()
  const fileInput = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [caption, setCaption] = useState('')
  const [scheduledFor, setScheduledFor] = useState(todayISO())
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'ok' | 'error'; text: string } | null>(null)

  function onPickFile(f: File | null) {
    setFile(f)
    if (f) setPreview(URL.createObjectURL(f))
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!file) {
      setMessage({ type: 'error', text: 'Elige una imagen' })
      return
    }
    // 10 MB en archivo ⇒ ~13.3 MB en base64, ya en el límite del servidor.
    // Se corta antes para no dejar al usuario esperando un rechazo del servidor.
    if (file.size > 8 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'La imagen pesa demasiado (máximo 8 MB). Compruébala e intenta con una más liviana.' })
      return
    }
    setLoading(true)
    setMessage(null)

    // Nunca dejar el botón pegado: cualquier falla (de red, del servidor,
    // lo que sea) tiene que volver a habilitar el formulario.
    try {
      const { base64, type } = await fileToBase64(file)
      const res = await scheduleInstagramPost({
        imageBase64: base64,
        imageType: type,
        caption,
        scheduledFor,
      })

      if (res?.error) {
        setMessage({ type: 'error', text: res.error })
        return
      }

      setMessage({ type: 'ok', text: 'Publicación programada' })
      setFile(null)
      setPreview(null)
      setCaption('')
      setScheduledFor(todayISO())
      if (fileInput.current) fileInput.current.value = ''
      router.refresh()
    } catch {
      setMessage({ type: 'error', text: 'No se pudo programar la publicación. Intenta de nuevo.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="card p-5 h-fit sticky top-4">
      <h2 className="font-bold mb-4" style={{ color: 'var(--text)' }}>Nueva publicación</h2>

      <label
        className="block border-2 border-dashed rounded-xl p-4 text-center cursor-pointer mb-4"
        style={{ borderColor: 'var(--gray-200)' }}
      >
        <input
          ref={fileInput}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => onPickFile(e.target.files?.[0] ?? null)}
        />
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="Vista previa" className="mx-auto rounded-lg max-h-56 object-contain" />
        ) : (
          <div className="py-6" style={{ color: 'var(--gray-400)' }}>
            <Upload size={22} className="mx-auto mb-2" />
            <p className="text-sm">Click para elegir una imagen</p>
          </div>
        )}
      </label>

      <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--gray-600)' }}>
        Descripción / copy
      </label>
      <textarea
        value={caption}
        onChange={(e) => setCaption(e.target.value)}
        rows={7}
        placeholder="Pega aquí el texto de la publicación, con hashtags incluidos..."
        className="input-field resize-none mb-4"
      />

      <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--gray-600)' }}>
        <CalendarDays size={12} className="inline mr-1" />
        Fecha de publicación
      </label>
      <input
        type="date"
        value={scheduledFor}
        min={todayISO()}
        onChange={(e) => setScheduledFor(e.target.value)}
        className="input-field mb-4"
      />

      {message && (
        <p className="text-sm mb-3" style={{ color: message.type === 'error' ? '#dc2626' : '#15803d' }}>
          {message.text}
        </p>
      )}

      <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-60">
        {loading ? <Loader2 size={16} className="animate-spin" /> : null}
        {loading ? 'Programando...' : 'Programar publicación'}
      </button>
    </form>
  )
}
