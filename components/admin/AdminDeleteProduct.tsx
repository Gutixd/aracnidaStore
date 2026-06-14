'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Trash2, Loader2, Check } from 'lucide-react'

interface Props { id: string; name: string }

export function AdminDeleteProduct({ id, name }: Props) {
  const [confirming, setConfirming] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleDelete() {
    setLoading(true)
    const supabase = createClient()
    await supabase.from('products').delete().eq('id', id)
    router.refresh()
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-1.5">
        <button
          onClick={handleDelete}
          disabled={loading}
          className="text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1"
          style={{ background: 'rgba(192,57,43,.1)', color: 'var(--red)' }}
        >
          {loading ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />} Confirmar
        </button>
        <button onClick={() => setConfirming(false)} className="text-xs px-2 py-1.5 rounded-lg transition-colors" style={{ color: 'var(--gray-400)' }}>
          Cancelar
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="p-1.5 rounded-lg transition-all"
      style={{ color: 'var(--gray-400)' }}
      title={`Eliminar ${name}`}
    >
      <Trash2 size={14} />
    </button>
  )
}
