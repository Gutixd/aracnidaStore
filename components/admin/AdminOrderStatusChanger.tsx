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
      {loading && <Loader2 size={14} className="animate-spin" style={{ color: 'var(--gray-400)' }} />}
      <select
        value={status}
        onChange={(e) => handleChange(e.target.value)}
        disabled={loading}
        className="input-field text-sm cursor-pointer"
        style={{ width: 'auto', paddingTop: '0.5rem', paddingBottom: '0.5rem' }}
      >
        {STATUSES.map((s) => <option key={s} value={s}>{ORDER_STATUS_LABELS[s]}</option>)}
      </select>
    </div>
  )
}
