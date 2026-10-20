'use client'

import { useState } from 'react'
import { Copy, Check } from 'lucide-react'

interface Props {
  text: string
  /** Texto del botón; sin él queda solo el ícono (para copiar un dato suelto) */
  label?: string
  title?: string
}

/** Copia un texto al portapapeles. Funciona también en http y en navegadores viejos. */
export function CopyButton({ text, label, title }: Props) {
  const [done, setDone] = useState(false)

  async function copy(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      const ta = document.createElement('textarea')
      ta.value = text
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      try { document.execCommand('copy') } catch {}
      document.body.removeChild(ta)
    }
    setDone(true)
    setTimeout(() => setDone(false), 1600)
  }

  return (
    <button
      type="button"
      onClick={copy}
      title={title ?? 'Copiar'}
      aria-label={title ?? 'Copiar'}
      className={`inline-flex items-center justify-center gap-1.5 rounded-lg transition-colors shrink-0 ${
        label ? 'px-3 py-1.5 text-xs font-semibold' : 'w-7 h-7'
      }`}
      style={{
        color: done ? '#15803d' : 'var(--gray-600)',
        background: done ? 'rgba(22,163,74,.1)' : 'var(--gray-50)',
      }}
    >
      {done ? <Check size={13} strokeWidth={3} /> : <Copy size={13} />}
      {label && <span>{done ? '¡Copiado!' : label}</span>}
    </button>
  )
}
