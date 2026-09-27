'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createCoupon } from '@/lib/actions/coupons'
import { couponDiscount, normalizeCode } from '@/lib/coupon-math'
import { formatPrice } from '@/lib/utils'
import { Loader2, Percent, DollarSign, Shuffle, Check } from 'lucide-react'

// Precio de referencia para el ejemplo en vivo (un disfraz).
const EJEMPLO = 34990

function randomCode() {
  // Sin 0/O ni 1/I para que no se confundan al dictarlo o copiarlo.
  const abc = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let s = ''
  for (let i = 0; i < 6; i++) s += abc[Math.floor(Math.random() * abc.length)]
  return `ARACNIDA-${s}`
}

export function AdminCouponForm() {
  const router = useRouter()
  const [pending, start] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState<string | null>(null)

  const [code, setCode] = useState('')
  const [type, setType] = useState<'percent' | 'fixed'>('percent')
  const [value, setValue] = useState('')
  const [minSubtotal, setMinSubtotal] = useState('')
  const [maxUses, setMaxUses] = useState('')
  const [oncePerCustomer, setOncePerCustomer] = useState(true)
  const [startsAt, setStartsAt] = useState('')
  const [expiresAt, setExpiresAt] = useState('')
  const [note, setNote] = useState('')

  const num = Number(value)
  const ejemplo = num > 0 ? couponDiscount({ type, value: num }, EJEMPLO) : 0

  function reset() {
    setCode(''); setValue(''); setMinSubtotal(''); setMaxUses('')
    setOncePerCustomer(true); setStartsAt(''); setExpiresAt(''); setNote('')
  }

  function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setDone(null)
    start(async () => {
      const res = await createCoupon({
        code,
        type,
        value: num,
        min_subtotal: Number(minSubtotal) || 0,
        max_uses: maxUses ? Number(maxUses) : null,
        once_per_customer: oncePerCustomer,
        // Fechas del día completo en hora local: el cupón vale desde las
        // 00:00 del inicio hasta las 23:59 del último día.
        starts_at: startsAt ? new Date(`${startsAt}T00:00:00`).toISOString() : null,
        expires_at: expiresAt ? new Date(`${expiresAt}T23:59:59`).toISOString() : null,
        note,
      })
      if (res.error) { setError(res.error); return }
      setDone(normalizeCode(code))
      reset()
      router.refresh()
    })
  }

  const label = 'block text-xs font-semibold mb-1.5'
  const labelStyle = { color: 'var(--gray-600)' }

  return (
    <form onSubmit={submit} className="card p-5 space-y-4 xl:sticky xl:top-6">
      <h2 className="font-bold" style={{ color: 'var(--text)' }}>Nuevo cupón</h2>

      <div>
        <label className={label} style={labelStyle}>Código</label>
        <div className="flex gap-2">
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase().replace(/\s+/g, ''))}
            placeholder="BLACKFRIDAY"
            maxLength={30}
            required
            className="input-field font-mono uppercase tracking-wider flex-1"
            style={{ minWidth: 0 }}
          />
          <button type="button" onClick={() => setCode(randomCode())} className="btn-ghost shrink-0 inline-flex items-center gap-1.5" title="Generar código aleatorio">
            <Shuffle size={14} /> Generar
          </button>
        </div>
        <p className="text-[11px] mt-1" style={{ color: 'var(--gray-400)' }}>Letras, números, guion o guion bajo. El cliente lo escribe en el checkout.</p>
      </div>

      <div>
        <label className={label} style={labelStyle}>Tipo de descuento</label>
        <div className="grid grid-cols-2 gap-2">
          {([
            { id: 'percent' as const, t: 'Porcentaje', icon: Percent },
            { id: 'fixed' as const, t: 'Monto fijo', icon: DollarSign },
          ]).map(({ id, t, icon: Icon }) => (
            <button key={id} type="button" onClick={() => setType(id)} aria-pressed={type === id}
              className="flex items-center justify-center gap-1.5 h-11 rounded-[10px] text-sm font-semibold transition-colors"
              style={type === id
                ? { background: 'var(--ink)', color: '#fff' }
                : { background: '#fff', color: 'var(--text)', boxShadow: 'inset 0 0 0 1px var(--gray-200)' }}>
              <Icon size={15} /> {t}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className={label} style={labelStyle}>{type === 'percent' ? 'Porcentaje (%)' : 'Monto a descontar ($)'}</label>
        <input type="number" inputMode="numeric" min={1} max={type === 'percent' ? 100 : undefined} step={1}
          value={value} onChange={(e) => setValue(e.target.value)} required
          placeholder={type === 'percent' ? '10' : '5000'} className="input-field" />
        {ejemplo > 0 && (
          <p className="text-[11px] mt-1" style={{ color: '#15803d' }}>
            Ejemplo: en un disfraz de {formatPrice(EJEMPLO)} descuenta {formatPrice(ejemplo)} → paga {formatPrice(EJEMPLO - ejemplo)} + envío
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={label} style={labelStyle}>Compra mínima ($)</label>
          <input type="number" inputMode="numeric" min={0} step={1} value={minSubtotal}
            onChange={(e) => setMinSubtotal(e.target.value)} placeholder="Sin mínimo" className="input-field" />
        </div>
        <div>
          <label className={label} style={labelStyle}>Límite de usos</label>
          <input type="number" inputMode="numeric" min={1} step={1} value={maxUses}
            onChange={(e) => setMaxUses(e.target.value)} placeholder="Ilimitado" className="input-field" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={label} style={labelStyle}>Válido desde</label>
          <input type="date" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} className="input-field" />
        </div>
        <div>
          <label className={label} style={labelStyle}>Válido hasta</label>
          <input type="date" value={expiresAt} min={startsAt || undefined} onChange={(e) => setExpiresAt(e.target.value)} className="input-field" />
        </div>
      </div>

      <label className="flex items-start gap-2.5 cursor-pointer">
        <input type="checkbox" checked={oncePerCustomer} onChange={(e) => setOncePerCustomer(e.target.checked)} className="mt-0.5" />
        <span className="text-sm" style={{ color: 'var(--gray-800)' }}>
          Un solo uso por cliente
          <span className="block text-[11px]" style={{ color: 'var(--gray-400)' }}>Se identifica por el correo del pedido</span>
        </span>
      </label>

      <div>
        <label className={label} style={labelStyle}>Nota interna (opcional)</label>
        <input value={note} onChange={(e) => setNote(e.target.value)} maxLength={200}
          placeholder="Ej: para clientes de Instagram" className="input-field" />
      </div>

      {error && <p className="text-sm rounded-lg px-3 py-2" style={{ background: 'rgba(192,57,43,.08)', color: 'var(--red)' }}>{error}</p>}
      {done && (
        <p className="text-sm rounded-lg px-3 py-2 flex items-center gap-1.5" style={{ background: 'rgba(22,163,74,.08)', color: '#15803d' }}>
          <Check size={15} /> Cupón <strong className="font-mono">{done}</strong> creado
        </p>
      )}

      <button type="submit" disabled={pending} className="btn-primary w-full justify-center">
        {pending ? <><Loader2 size={16} className="animate-spin" /> Creando...</> : 'Crear cupón'}
      </button>
    </form>
  )
}
