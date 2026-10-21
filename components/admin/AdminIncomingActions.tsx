'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, PackageCheck, CalendarClock, X } from 'lucide-react'
import { receiveIncomingBatch, cancelIncomingBatch, updateIncomingDates } from '@/lib/actions/incoming'

interface Props {
  batchId: string
  label: string
  quantity: number
  reserved: number
  from: string
  to: string
}

/** Botones de un lote en camino: llegó, cambiar fechas, cancelar. */
export function AdminIncomingActions({ batchId, label, quantity, reserved, from, to }: Props) {
  const router = useRouter()
  const [busy, setBusy] = useState<string | null>(null)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [editing, setEditing] = useState(false)
  const [f, setF] = useState(from)
  const [t, setT] = useState(to)

  const libres = quantity - reserved

  async function run(kind: string, fn: () => Promise<{ error?: string; ok?: boolean }>, okText: string) {
    setBusy(kind)
    setMsg(null)
    try {
      const res = await fn()
      if (res.error) setMsg({ ok: false, text: res.error })
      else {
        setMsg({ ok: true, text: okText })
        setEditing(false)
        router.refresh()
      }
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={!!busy}
          onClick={() => {
            const detalle = reserved > 0
              ? `${reserved} ya ${reserved === 1 ? 'está reservado' : 'están reservados'} (se entregan a esos clientes) y ${libres} pasan al stock.`
              : `Las ${quantity} unidades pasan al stock.`
            if (confirm(`¿Llegó ${label}?\n\n${detalle}`)) {
              run('recv', () => receiveIncomingBatch(batchId), 'Recibido: stock actualizado.')
            }
          }}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold text-white disabled:opacity-50"
          style={{ background: '#15803d' }}
        >
          {busy === 'recv' ? <Loader2 size={13} className="animate-spin" /> : <PackageCheck size={13} />}
          Llegó
        </button>
        <button
          type="button"
          disabled={!!busy}
          onClick={() => setEditing((e) => !e)}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold disabled:opacity-50"
          style={{ background: 'var(--gray-50)', color: 'var(--gray-600)' }}
        >
          <CalendarClock size={13} /> Cambiar fechas
        </button>
        <button
          type="button"
          disabled={!!busy || reserved > 0}
          title={reserved > 0 ? 'Tiene reservas: no se puede cancelar' : 'Cancelar este lote'}
          onClick={() => {
            if (confirm(`¿Cancelar ${label}? Dejará de mostrarse en la tienda.`)) {
              run('cancel', () => cancelIncomingBatch(batchId), 'Lote cancelado.')
            }
          }}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold disabled:opacity-40"
          style={{ background: 'var(--gray-50)', color: 'var(--gray-600)' }}
        >
          {busy === 'cancel' ? <Loader2 size={13} className="animate-spin" /> : <X size={13} />}
          Cancelar
        </button>
      </div>

      {editing && (
        <div className="flex flex-wrap items-end gap-2">
          <input type="date" value={f} onChange={(e) => setF(e.target.value)} className="input-field !py-1.5 text-sm w-auto" aria-label="Desde" />
          <input type="date" value={t} min={f} onChange={(e) => setT(e.target.value)} className="input-field !py-1.5 text-sm w-auto" aria-label="Hasta" />
          <button
            type="button"
            disabled={!!busy}
            onClick={() => run('dates', () => updateIncomingDates(batchId, f, t), 'Fechas actualizadas.')}
            className="btn-primary !py-1.5 !px-3 text-xs"
          >
            {busy === 'dates' ? <Loader2 size={13} className="animate-spin" /> : 'Guardar'}
          </button>
        </div>
      )}

      {msg && <p className="text-xs font-semibold" style={{ color: msg.ok ? '#15803d' : 'var(--red)' }}>{msg.text}</p>}
    </div>
  )
}
