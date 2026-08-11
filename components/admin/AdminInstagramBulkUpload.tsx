'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { scheduleInstagramPostAI } from '@/lib/actions/instagram'
import { Sparkles, Loader2, CheckCircle2, AlertCircle, Upload } from 'lucide-react'

interface Item {
  file: File
  preview: string
  status: 'esperando' | 'procesando' | 'listo' | 'error'
  caption?: string
  scheduledFor?: string
  error?: string
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

function formatDate(d: string) {
  return new Date(`${d}T12:00:00`).toLocaleDateString('es-CL', { weekday: 'short', day: 'numeric', month: 'short' })
}

export function AdminInstagramBulkUpload() {
  const router = useRouter()
  const fileInput = useRef<HTMLInputElement>(null)
  const [items, setItems] = useState<Item[]>([])
  const [running, setRunning] = useState(false)

  function onPickFiles(files: FileList | null) {
    if (!files) return
    const oversized = Array.from(files).filter((f) => f.size > 8 * 1024 * 1024)
    const valid = Array.from(files).filter((f) => f.size <= 8 * 1024 * 1024)

    setItems((prev) => [
      ...prev,
      ...valid.map((file) => ({ file, preview: URL.createObjectURL(file), status: 'esperando' as const })),
    ])

    if (oversized.length > 0) {
      alert(`${oversized.length} imagen(es) pesan más de 8 MB y no se agregaron: ${oversized.map((f) => f.name).join(', ')}`)
    }
    if (fileInput.current) fileInput.current.value = ''
  }

  async function processAll() {
    setRunning(true)

    // Secuencial a propósito: cada imagen tiene que quedar guardada antes de
    // calcular la fecha de la siguiente, si no dos fotos podrían caer el
    // mismo día.
    for (let i = 0; i < items.length; i++) {
      if (items[i].status !== 'esperando') continue

      setItems((prev) => prev.map((it, idx) => (idx === i ? { ...it, status: 'procesando' } : it)))

      try {
        const { base64, type } = await fileToBase64(items[i].file)
        const res = await scheduleInstagramPostAI({ imageBase64: base64, imageType: type })

        if (res?.error) {
          setItems((prev) => prev.map((it, idx) => (idx === i ? { ...it, status: 'error', error: res.error } : it)))
        } else {
          setItems((prev) =>
            prev.map((it, idx) =>
              idx === i ? { ...it, status: 'listo', caption: res!.caption, scheduledFor: res!.scheduledFor } : it
            )
          )
        }
      } catch {
        setItems((prev) =>
          prev.map((it, idx) => (idx === i ? { ...it, status: 'error', error: 'Falló la subida' } : it))
        )
      }
    }

    setRunning(false)
    router.refresh()
  }

  const pendientesCount = items.filter((it) => it.status === 'esperando').length

  return (
    <div className="card p-5 mb-6">
      <div className="flex items-center gap-2 mb-1">
        <Sparkles size={16} style={{ color: 'var(--red)' }} />
        <h2 className="font-bold" style={{ color: 'var(--text)' }}>Carga masiva con copy automático</h2>
      </div>
      <p className="text-sm mb-4" style={{ color: 'var(--gray-400)' }}>
        Sube varias imágenes de una. Claude mira cada foto y escribe el copy solo, y se reparten en
        lunes, miércoles y viernes empezando mañana — sin que tengas que escribir nada.
      </p>

      <label
        className="block border-2 border-dashed rounded-xl p-6 text-center cursor-pointer mb-4"
        style={{ borderColor: 'var(--gray-200)' }}
      >
        <input
          ref={fileInput}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => onPickFiles(e.target.files)}
        />
        <Upload size={22} className="mx-auto mb-2" style={{ color: 'var(--gray-400)' }} />
        <p className="text-sm" style={{ color: 'var(--gray-400)' }}>Click para elegir varias imágenes a la vez</p>
      </label>

      {items.length > 0 && (
        <>
          <div className="space-y-2 mb-4">
            {items.map((it, idx) => (
              <div key={idx} className="flex gap-3 p-3 rounded-xl" style={{ background: 'var(--gray-50)' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={it.preview} alt="" className="w-14 h-14 rounded-lg object-cover shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium truncate" style={{ color: 'var(--text)' }}>
                      {it.file.name}
                    </span>
                    {it.status === 'esperando' && (
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'var(--gray-100)', color: 'var(--gray-400)' }}>
                        En cola
                      </span>
                    )}
                    {it.status === 'procesando' && (
                      <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(59,130,246,.1)', color: '#3b82f6' }}>
                        <Loader2 size={10} className="animate-spin" /> Generando copy...
                      </span>
                    )}
                    {it.status === 'listo' && (
                      <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(22,163,74,.1)', color: '#15803d' }}>
                        <CheckCircle2 size={10} /> {it.scheduledFor && formatDate(it.scheduledFor)}
                      </span>
                    )}
                    {it.status === 'error' && (
                      <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(220,38,38,.1)', color: '#dc2626' }}>
                        <AlertCircle size={10} /> Error
                      </span>
                    )}
                  </div>
                  {it.status === 'listo' && it.caption && (
                    <p className="text-xs line-clamp-2" style={{ color: 'var(--gray-400)' }}>{it.caption}</p>
                  )}
                  {it.status === 'error' && it.error && (
                    <p className="text-xs" style={{ color: '#dc2626' }}>{it.error}</p>
                  )}
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={processAll}
            disabled={running || pendientesCount === 0}
            className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {running ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
            {running ? 'Procesando...' : `Generar y programar ${pendientesCount} imagen${pendientesCount === 1 ? '' : 'es'}`}
          </button>
        </>
      )}
    </div>
  )
}
