'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { ORDER_STATUS_LABELS } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

const STATUSES = [
  'pendiente',
  'confirmado',
  'en_preparacion',
  'en_reparto',
  'entregado',
  'cancelado',
]

interface Props {
  orderId: string
  currentStatus: string
}

export function AdminOrderStatusChanger({ orderId, currentStatus }: Props) {
  const [status, setStatus] = useState(currentStatus)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleChange(newStatus: string) {
    if (newStatus === status) return
    setLoading(true)

    const supabase = createClient()
    await supabase
      .from('orders')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', orderId)

    // Notify Telegram via API route
    await fetch('/api/notify-order-status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId, newStatus }),
    })

    setStatus(newStatus)
    setLoading(false)
    router.refresh()
  }

  return (
    <div className="flex items-center gap-2">
      {loading && <Loader2 size={14} className="animate-spin text-white/30" />}
      <select
        value={status}
        onChange={(e) => handleChange(e.target.value)}
        disabled={loading}
        className="bg-[#0d1117] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-600/50 disabled:opacity-50 cursor-pointer"
      >
        {STATUSES.map((s) => (
          <option key={s} value={s} className="bg-[#0d1117]">
            {ORDER_STATUS_LABELS[s]}
          </option>
        ))}
      </select>
    </div>
  )
}
