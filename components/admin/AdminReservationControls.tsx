'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Landmark, Shirt } from 'lucide-react'
import { RESERVATION_STATUS_LABELS, RESERVATION_STATUS_FLOW } from '@/lib/reservations'
import {
  updateReservationStatus, confirmReservationPayment,
  getSizeChangeOptions, changeReservationSize, type SizeChangeOption,
} from '@/lib/actions/reservations'
import { formatPrice } from '@/lib/utils'

interface Props {
  reservationId: string
  currentStatus: string
  paymentStatus: string
  paymentMethod: string | null
  items: { id: string; product_name: string; size: string }[]
}

export function AdminReservationControls({
  reservationId, currentStatus, paymentStatus, paymentMethod, items,
}: Props) {
  const [status, setStatus] = useState(currentStatus)
  const [loading, setLoading] = useState<string | null>(null)
  const router = useRouter()
  const [sizeItem, setSizeItem] = useState<string | null>(null)
  const [options, setOptions] = useState<SizeChangeOption[] | null>(null)
  const [currentSize, setCurrentSize] = useState('')
  const [choice, setChoice] = useState('')

  async function openSizeChange(itemId: string) {
    setSizeItem(itemId)
    setOptions(null)
    setChoice('')
    const res = await getSizeChangeOptions(itemId)
    if (res.error) {
      alert(res.error)
      setSizeItem(null)
      return
    }
    setCurrentSize(res.currentSize ?? '')
    setOptions(res.options ?? [])
  }

  async function handleSizeChange() {
    const opt = options?.find((o) => `${o.variant_id}|${o.batch_id ?? ''}` === choice)
    if (!opt || !sizeItem) return
    setLoading('size')
    const res = await changeReservationSize({ itemId: sizeItem, variantId: opt.variant_id, batchId: opt.batch_id })
    setLoading(null)
    if (res?.error) {
      alert(res.error)
      return
    }
    setSizeItem(null)
    router.refresh()
  }

  const cerrada = status === 'cancelado' || status === 'entregado'

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

      {!cerrada && items.length > 0 && (
        <div>
          <p className="text-xs mb-1 font-semibold" style={{ color: 'var(--gray-400)' }}>Talla</p>
          {sizeItem === null ? (
            <div className="flex gap-2">
              {items.map((it) => (
                <button
                  key={it.id}
                  onClick={() => openSizeChange(it.id)}
                  disabled={loading !== null}
                  className="btn-secondary text-xs py-2 px-3 disabled:opacity-50 inline-flex items-center gap-1"
                >
                  <Shirt size={14} /> Cambiar talla{items.length > 1 ? ` (${it.size})` : ''}
                </button>
              ))}
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              {options === null ? (
                <Loader2 size={14} className="animate-spin" style={{ color: 'var(--gray-400)' }} />
              ) : options.length === 0 ? (
                <span className="text-xs" style={{ color: 'var(--gray-600)' }}>
                  No hay otra talla disponible (en camino, con cupo).
                </span>
              ) : (
                <select
                  value={choice}
                  onChange={(e) => setChoice(e.target.value)}
                  className="input-field text-sm cursor-pointer"
                  style={{ width: 'auto', paddingTop: '0.5rem', paddingBottom: '0.5rem' }}
                >
                  <option value="">De {currentSize} a…</option>
                  {options.map((o) => (
                    <option key={`${o.variant_id}|${o.batch_id ?? ''}`} value={`${o.variant_id}|${o.batch_id ?? ''}`}>
                      Talla {o.size}
                      {o.arrives_to ? ` · llega hasta ${o.arrives_to} · ${o.available} cupos` : ''}
                      {` · ${formatPrice(o.price)}`}
                    </option>
                  ))}
                </select>
              )}
              {choice && (
                <button onClick={handleSizeChange} disabled={loading !== null} className="btn-primary text-xs py-2 px-3 disabled:opacity-50">
                  {loading === 'size' ? <Loader2 size={14} className="animate-spin" /> : 'Guardar'}
                </button>
              )}
              <button onClick={() => setSizeItem(null)} className="text-xs underline" style={{ color: 'var(--gray-400)' }}>
                Cancelar
              </button>
            </div>
          )}
        </div>
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
