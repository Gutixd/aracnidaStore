'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { updatePaymentStatus } from '@/lib/actions/orders'
import { PAYMENT_STATUS_LABELS } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

const STATUSES = ['pendiente', 'pagado', 'rechazado', 'reembolsado']

interface Props {
  orderId: string
  currentStatus: string
}

export function AdminPaymentStatusChanger({ orderId, currentStatus }: Props) {
  const [status, setStatus] = useState(currentStatus)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleChange(newStatus: string) {
    if (newStatus === status) return
    setLoading(true)

    const res = await updatePaymentStatus(orderId, newStatus)
    if (res?.error) {
      setLoading(false)
      alert(res.error)
      return
    }

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
        aria-label="Estado de pago"
        className="input-field text-sm cursor-pointer"
        style={{ width: 'auto', paddingTop: '0.5rem', paddingBottom: '0.5rem' }}
      >
        {STATUSES.map((s) => (
          <option key={s} value={s}>{PAYMENT_STATUS_LABELS[s]}</option>
        ))}
      </select>
    </div>
  )
}
