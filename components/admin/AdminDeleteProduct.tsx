'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Trash2, Loader2 } from 'lucide-react'

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
          className="text-xs text-red-400 hover:text-red-300 bg-red-900/20 hover:bg-red-900/30 px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1"
        >
          {loading ? <Loader2 size={12} className="animate-spin" /> : '✓'} Confirmar
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="text-xs text-white/30 hover:text-white/60 px-2 py-1.5 rounded-lg transition-colors"
        >
          Cancelar
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="text-white/20 hover:text-red-400 p-1.5 rounded-lg hover:bg-red-900/10 transition-all"
      title={`Eliminar ${name}`}
    >
      <Trash2 size={14} />
    </button>
  )
}
