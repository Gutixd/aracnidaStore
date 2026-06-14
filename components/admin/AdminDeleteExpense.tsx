'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Trash2, Check, X } from 'lucide-react'

export function AdminDeleteExpense({ id }: { id: string }) {
  const [confirming, setConfirming] = useState(false)
  const router = useRouter()

  async function handleDelete() {
    const supabase = createClient()
    await supabase.from('expenses').delete().eq('id', id)
    router.refresh()
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-1">
        <button onClick={handleDelete} className="p-1.5 rounded-lg" style={{ background: 'rgba(192,57,43,.1)', color: 'var(--red)' }} aria-label="Confirmar">
          <Check size={14} />
        </button>
        <button onClick={() => setConfirming(false)} className="p-1.5 rounded-lg" style={{ color: 'var(--gray-400)' }} aria-label="Cancelar">
          <X size={14} />
        </button>
      </div>
    )
  }

  return (
    <button onClick={() => setConfirming(true)} className="p-1.5 rounded-lg transition-colors" style={{ color: 'var(--gray-400)' }} aria-label="Eliminar">
      <Trash2 size={14} />
    </button>
  )
}
