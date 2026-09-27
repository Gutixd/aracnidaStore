'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { setCouponActive, deleteCoupon } from '@/lib/actions/coupons'
import { Loader2, Trash2 } from 'lucide-react'

export function AdminCouponActions({ id, active, used }: { id: string; active: boolean; used: boolean }) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function toggle() {
    setError(null)
    start(async () => {
      const res = await setCouponActive(id, !active)
      if (res.error) setError(res.error)
      router.refresh()
    })
  }

  function remove() {
    if (!confirm('¿Borrar este cupón? Esta acción no se puede deshacer.')) return
    setError(null)
    start(async () => {
      const res = await deleteCoupon(id)
      if (res.error) setError(res.error)
      router.refresh()
    })
  }

  return (
    <div className="flex flex-col items-end gap-1.5">
      <div className="flex items-center gap-2">
        {pending && <Loader2 size={15} className="animate-spin" style={{ color: 'var(--gray-400)' }} />}
        <button type="button" onClick={toggle} disabled={pending} className="btn-ghost text-xs py-1.5 px-3">
          {active ? 'Desactivar' : 'Activar'}
        </button>
        {/* Un cupón ya usado no se borra: quedaría un pedido apuntando a nada. */}
        {!used && (
          <button type="button" onClick={remove} disabled={pending} aria-label="Borrar cupón"
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-red-50"
            style={{ color: 'var(--gray-400)' }}>
            <Trash2 size={15} />
          </button>
        )}
      </div>
      {error && <p className="text-xs max-w-[220px] text-right" style={{ color: 'var(--red)' }}>{error}</p>}
    </div>
  )
}
