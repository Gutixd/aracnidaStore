'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'

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
        <button onClick={handleDelete} className="text-xs text-red-400 hover:text-red-300 px-2 py-1 bg-red-900/10 rounded transition-colors">
          ✓
        </button>
        <button onClick={() => setConfirming(false)} className="text-xs text-white/30 hover:text-white/60 px-2 py-1 transition-colors">
          ✕
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="text-white/20 hover:text-red-400 p-1.5 rounded-lg transition-colors"
    >
      <Trash2 size={14} />
    </button>
  )
}
