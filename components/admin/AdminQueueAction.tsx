'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Check, Truck, Package, Wallet, Landmark, Hourglass } from 'lucide-react'
import { updateOrderStatus, updatePaymentStatus } from '@/lib/actions/orders'
import { updateReservationStatus, confirmReservationPayment } from '@/lib/actions/reservations'
import type { QueueAction } from '@/lib/work-queue'

/** Botón del siguiente paso de un pedido, directo desde la cola de trabajo. */
export function AdminQueueAction({ orderId, action }: { orderId: string; action: QueueAction }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)

  if (action.kind === 'none') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg"
        style={{ background: 'var(--gray-50)', color: 'var(--gray-400)' }}>
        <Hourglass size={13} /> {action.label}
      </span>
    )
  }

  async function run() {
    if (busy || done) return
    if (action.kind === 'confirm-reservation-payment' &&
      !confirm('¿Confirmas que recibiste el pago? Se le enviará el comprobante al cliente.')) return
    if (action.kind === 'mark-paid' &&
      !confirm('¿Marcar este pedido como pagado? Úsalo solo si ya viste la plata.')) return

    setBusy(true)
    let error: string | undefined
    try {
      if (action.kind === 'confirm-reservation-payment') {
        error = (await confirmReservationPayment(orderId))?.error
      } else if (action.kind === 'mark-paid') {
        error = (await updatePaymentStatus(orderId, 'pagado'))?.error
      } else if (action.kind === 'reservation-status') {
        error = (await updateReservationStatus(orderId, action.to))?.error
      } else if (action.kind === 'order-status') {
        const res = await updateOrderStatus(orderId, action.to)
        error = res?.error
        if (!error) {
          // Aviso por Telegram, igual que desde el detalle del pedido
          await fetch('/api/notify-order-status', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderId, newStatus: action.to }),
          }).catch(() => {})
        }
      }
    } catch {
      error = 'Ocurrió un problema. Intenta de nuevo.'
    }
    setBusy(false)
    if (error) {
      alert(error)
      return
    }
    setDone(true)
    router.refresh()
  }

  const Icon = action.kind === 'confirm-reservation-payment' ? Landmark
    : action.kind === 'mark-paid' ? Wallet
    : action.label.includes('despachado') ? Truck
    : action.label.includes('preparar') ? Package : Check

  return (
    <button
      type="button"
      onClick={run}
      disabled={busy || done}
      className="inline-flex items-center justify-center gap-1.5 px-4 min-h-[42px] rounded-xl text-sm font-bold text-white transition-opacity disabled:opacity-60"
      style={{ background: done ? '#15803d' : 'var(--ink)' }}
    >
      {busy ? <Loader2 size={15} className="animate-spin" /> : done ? <Check size={15} strokeWidth={3} /> : <Icon size={15} />}
      {done ? 'Listo' : action.label}
    </button>
  )
}
