'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Landmark } from 'lucide-react'
import { RESERVATION_STATUS_LABELS, RESERVATION_STATUS_FLOW } from '@/lib/reservations'
import { updateReservationStatus, confirmReservationPayment } from '@/lib/actions/reservations'

interface Props {
  reservationId: string
  currentStatus: string
  paymentStatus: string
  paymentMethod: string | null
}

export function AdminReservationControls({
  reservationId, currentStatus, paymentStatus, paymentMethod,
}: Props) {
  const [status, setStatus] = useState(currentStatus)
  const [loading, setLoading] = useState<string | null>(null)
  const router = useRouter()

  async function handleStatus(newStatus: string) {
    if (newStatus === status) return
    setLoading('status')
    const res = await updateReservationStatus(reservationId, newStatus)
    setLoading(null)
    if (res?.error) {
      alert(res.error)
      return
    }
    setStatus(newStatus)
    router.refresh()
  }

  async function handleConfirmPayment() {
    if (!confirm('¿Confirmas que recibiste el pago? Se le enviará el comprobante al cliente.')) return
    setLoading('payment')
    const res = await confirmReservationPayment(reservationId)
    setLoading(null)
    if (res?.error) {
      alert(res.error)
      return
    }
    router.refresh()
  }

  const esperandoTransferencia = paymentStatus === 'pendiente' && paymentMethod === 'transferencia'

  return (
    <div className="flex flex-wrap items-end gap-3">
      {esperandoTransferencia && (
        <button
          onClick={handleConfirmPayment}
          disabled={loading !== null}
          className="btn-primary text-xs py-2 px-3 disabled:opacity-50"
        >
          {loading === 'payment'
            ? <Loader2 size={14} className="animate-spin" />
            : <><Landmark size={14} /> Confirmar pago recibido</>}
        </button>
      )}

      <div>
        <p className="text-xs mb-1 font-semibold" style={{ color: 'var(--gray-400)' }}>Estado</p>
        <div className="flex items-center gap-2">
          {loading === 'status' && <Loader2 size={14} className="animate-spin" style={{ color: 'var(--gray-400)' }} />}
          <select
            value={status}
            onChange={(e) => handleStatus(e.target.value)}
            disabled={loading !== null}
            className="input-field text-sm cursor-pointer"
            style={{ width: 'auto', paddingTop: '0.5rem', paddingBottom: '0.5rem' }}
          >
            {RESERVATION_STATUS_FLOW.map((s) => (
              <option key={s} value={s}>{RESERVATION_STATUS_LABELS[s]}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  )
}
