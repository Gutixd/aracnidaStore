'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { resumeConversation, pauseConversationManually } from '@/lib/actions/assistant'

export function AdminConversationActions({ igUserId, paused }: { igUserId: string; paused: boolean }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  return (
    <button
      type="button"
      disabled={busy}
      onClick={async () => {
        setBusy(true)
        await (paused ? resumeConversation(igUserId) : pauseConversationManually(igUserId))
        setBusy(false)
        router.refresh()
      }}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
      style={paused ? { background: '#15803d', color: '#fff' } : { background: 'var(--gray-50)', color: 'var(--gray-600)' }}
    >
      {busy && <Loader2 size={12} className="animate-spin" />}
      {paused ? 'Reactivar IA' : 'Pausar IA (la atiendo yo)'}
    </button>
  )
}
