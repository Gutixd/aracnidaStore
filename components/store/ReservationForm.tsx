'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Product, ProductVariant } from '@/types'
import { formatPrice } from '@/lib/utils'
import {
  calcReservation, minReservationDate, hasEnoughNotice,
  formatReservationDate, RESERVATION_MIN_DAYS,
} from '@/lib/reservations'
import { createReservation } from '@/lib/actions/reservations'
import { createReservationPreference } from '@/lib/actions/payment'
import { REGIONES_CHILE, getShippingInfo } from '@/lib/shipping'
import { PICKUP_PLACE, PICKUP_SLOTS } from '@/lib/pickup'
import { CalendarDays, Minus, Plus, Loader2, CreditCard, Landmark, Tag, Info, Truck, MapPin, ChevronDown } from 'lucide-react'

interface Props {
  product: Product
  variants: ProductVariant[]
}

const MAX_QTY = 10

export function ReservationForm({ product, variants }: Props) {
  const router = useRouter()

  const [variantId, setVariantId] = useState(variants[0]?.id ?? '')
  const [quantity, setQuantity] = useState(1)
  const [neededBy, setNeededBy] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<'mercadopago' | 'transferencia'>('mercadopago')
  const [deliveryMethod, setDeliveryMethod] = useState<'retiro' | 'delivery' | null>(null)
  const [address, setAddress] = useState('')
  const [region, setRegion] = useState('')
  const [commune, setCommune] = useState('')
  const [reference, setReference] = useState('')
  const [notes, setNotes] = useState('')
  const [optIn, setOptIn] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const minDate = useMemo(() => minReservationDate(), [])
  const selected = variants.find((v) => v.id === variantId) ?? variants[0]
  const amounts = useMemo(
    () => calcReservation(Number(selected?.price ?? product.price), quantity),
    [selected, product.price, quantity]
  )

  const dateOk = neededBy !== '' && hasEnoughNotice(neededBy)
  const dateTouchedButEarly = neededBy !== '' && !dateOk

  // Mismo cálculo que hace el servidor (que es el que manda): el descuento
  // aplica solo al producto y el envío se suma completo.
  const isDelivery = deliveryMethod === 'delivery'
  const shippingInfo = getShippingInfo(region || undefined, amounts.final)
  const shippingCost = isDelivery && region ? shippingInfo.cost : 0
  const total = amounts.final + shippingCost
  const deliveryOk =
    deliveryMethod === 'retiro' ||
    (isDelivery && address.trim() !== '' && region !== '' && commune.trim() !== '')
  const canSubmit = dateOk && deliveryOk

  const missingHint = !dateOk
    ? 'Elige una fecha para continuar'
    : !deliveryMethod
      ? 'Elige cómo quieres recibirlo'
      : !deliveryOk
        ? 'Completa la dirección de envío'
        : null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (loading || !canSubmit) return
    setError(null)
    setLoading(true)

    try {
      const result = await createReservation({
        variant_id: variantId,
        quantity,
        needed_by: neededBy,
        customer_name: name,
        customer_email: email,
        customer_phone: phone,
        payment_method: paymentMethod,
        delivery_method: deliveryMethod ?? 'retiro',
        delivery_address: isDelivery ? address : undefined,
        delivery_region: isDelivery ? region : undefined,
        delivery_commune: isDelivery ? commune : undefined,
        delivery_reference: isDelivery && reference ? reference : undefined,
        notes: notes || undefined,
        marketing_opt_in: optIn,
      })

      if ('error' in result && result.error) {
        setError(result.error)
        return
      }
      const reservationId = 'reservationId' in result ? result.reservationId : undefined
      if (!reservationId) {
        setError('No se pudo crear la reserva. Intenta nuevamente.')
        return
      }

      if (paymentMethod === 'mercadopago') {
        const pref = await createReservationPreference(reservationId)
        if (pref.error || !pref.url) {
          // La reserva quedó creada pero sin pagar: se le manda igual a la
          // página de estado, donde puede reintentar el pago.
          router.push(`/reserva/${reservationId}?pago=error`)
          return
        }
        window.location.href = pref.url
        return
      }

      // Transferencia: no hay redirección a un procesador, se le muestran los
      // datos bancarios en la página de confirmación.
      router.push(`/reserva/${reservationId}`)
    } catch {
      setError('Ocurrió un problema. Intenta nuevamente.')
    } finally {
      setLoading(false)
    }
  }

  const labelCls = 'text-xs font-bold uppercase tracking-widest mb-2 block'
  const labelStyle = { color: 'var(--gray-400)' }
  const stepCls = 'w-6 h-6 rounded-full flex items-center justify-center text-xs font-black shrink-0'
  const stepStyle = { background: 'var(--red)', color: '#fff' }

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8 items-start">
      {/* ── Columna izquierda: los pasos ── */}
      <div className="space-y-6">
        {/* Producto */}
        <div className="card p-5">
          <div className="flex items-center gap-3 mb-4">
            <span className={stepCls} style={stepStyle}>1</span>
            <h2 className="font-bold" style={{ color: 'var(--text)' }}>Producto y talla</h2>
          </div>

          <div className="flex gap-4 items-center mb-5">
            <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 relative" style={{ background: 'var(--gray-50)' }}>
              {product.image_url && (
                <Image src={product.image_url} alt={product.name} fill className="object-contain" sizes="64px" />
              )}
            </div>
            <div>
              <p className="font-bold text-sm" style={{ color: 'var(--text)' }}>{product.name}</p>
              <p className="text-xs" style={{ color: 'var(--gray-400)' }}>{product.color}</p>
            </div>
          </div>

          {variants.length > 1 && (
            <>
              <span className={labelCls} style={labelStyle}>Talla (cm)</span>
              <div className="flex flex-wrap gap-2">
                {variants.map((v) => {
                  const active = v.id === variantId
                  return (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => setVariantId(v.id)}
                      className="min-w-[52px] px-3 py-2.5 rounded-xl text-sm font-bold transition-all"
                      style={active
                        ? { background: 'var(--red)', color: '#fff', border: '1.5px solid var(--red)' }
                        : { background: '#fff', color: 'var(--text)', border: '1.5px solid var(--gray-200)' }}
                    >
                      {v.size}
                    </button>
                  )
                })}
              </div>
              {/* En una reserva la talla NO depende del stock actual: el
                  producto se encarga después, por eso se ofrecen todas. */}
              <p className="text-xs mt-3 flex items-start gap-1.5" style={{ color: 'var(--gray-400)' }}>
                <Info size={13} className="mt-0.5 shrink-0" />
                Puedes reservar cualquier talla, tengamos stock o no — para eso es la reserva.
              </p>
            </>
          )}
        </div>

        {/* Cantidad */}
        <div className="card p-5">
          <div className="flex items-center gap-3 mb-4">
            <span className={stepCls} style={stepStyle}>2</span>
            <h2 className="font-bold" style={{ color: 'var(--text)' }}>Cantidad</h2>
          </div>
          <div className="flex items-center gap-1 rounded-xl p-1 w-fit" style={{ border: '1.5px solid var(--gray-200)' }}>
            <button type="button" onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ color: 'var(--gray-600)' }}
              aria-label="Disminuir">
              <Minus size={15} />
            </button>
            <span className="w-10 text-center font-bold tabular-nums">{quantity}</span>
            <button type="button" onClick={() => setQuantity((q) => Math.min(MAX_QTY, q + 1))}
              className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ color: 'var(--gray-600)' }}
              aria-label="Aumentar">
              <Plus size={15} />
            </button>
          </div>
        </div>

        {/* Fecha */}
        <div className="card p-5">
          <div className="flex items-center gap-3 mb-4">
            <span className={stepCls} style={stepStyle}>3</span>
            <h2 className="font-bold" style={{ color: 'var(--text)' }}>¿Para cuándo lo necesitas?</h2>
          </div>
          <input
            type="date"
            required
            min={minDate}
            value={neededBy}
            onChange={(e) => setNeededBy(e.target.value)}
            className="input-field"
          />
          {dateTouchedButEarly ? (
            <p className="text-xs mt-2 font-semibold" style={{ color: 'var(--red)' }}>
              Necesitamos al menos {RESERVATION_MIN_DAYS} días para conseguir el producto.
              La fecha más cercana disponible es el {formatReservationDate(minDate)}.
            </p>
          ) : (
            <p className="text-xs mt-2 flex items-start gap-1.5" style={{ color: 'var(--gray-400)' }}>
              <CalendarDays size={13} className="mt-0.5 shrink-0" />
              Mínimo {RESERVATION_MIN_DAYS} días de anticipación — desde el {formatReservationDate(minDate)}.
            </p>
          )}
        </div>

        {/* Datos */}
        <div className="card p-5 space-y-4">
          <div className="flex items-center gap-3 mb-1">
            <span className={stepCls} style={stepStyle}>4</span>
            <h2 className="font-bold" style={{ color: 'var(--text)' }}>Tus datos</h2>
          </div>
          <div>
            <span className={labelCls} style={labelStyle}>Nombre completo</span>
            <input required value={name} onChange={(e) => setName(e.target.value)} className="input-field" placeholder="Tu nombre" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <span className={labelCls} style={labelStyle}>Email</span>
              <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input-field" placeholder="tu@email.com" />
            </div>
            <div>
              <span className={labelCls} style={labelStyle}>Teléfono</span>
              <input required value={phone} onChange={(e) => setPhone(e.target.value)} className="input-field" placeholder="+56 9 ..." />
            </div>
          </div>
          <div>
            <span className={labelCls} style={labelStyle}>Nota (opcional)</span>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="input-field" placeholder="Algo que debamos saber" />
          </div>
          <label className="flex items-start gap-2.5 cursor-pointer">
            <input type="checkbox" checked={optIn} onChange={(e) => setOptIn(e.target.checked)} className="mt-0.5" />
            <span className="text-xs" style={{ color: 'var(--gray-600)' }}>
              Quiero recibir ofertas y novedades por correo.
            </span>
          </label>
        </div>

        {/* Entrega */}
        <div className="card p-5">
          <div className="flex items-center gap-3 mb-4">
            <span className={stepCls} style={stepStyle}>5</span>
            <h2 className="font-bold" style={{ color: 'var(--text)' }}>¿Cómo lo recibes?</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {([
              { id: 'retiro' as const, label: `Retiro en Maipú`, desc: `Gratis · ${PICKUP_PLACE}`, icon: MapPin },
              { id: 'delivery' as const, label: 'Envío a domicilio', desc: 'Blue Express · todo Chile', icon: Truck },
            ]).map(({ id, label, desc, icon: Icon }) => {
              const active = deliveryMethod === id
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setDeliveryMethod(id)}
                  aria-pressed={active}
                  className="text-left p-4 rounded-xl transition-all"
                  style={active
                    ? { border: '1.5px solid var(--red)', background: 'rgba(192,57,43,.04)' }
                    : { border: '1.5px solid var(--gray-200)', background: '#fff' }}
                >
                  <Icon size={18} style={{ color: active ? 'var(--red)' : 'var(--gray-400)' }} />
                  <p className="font-bold text-sm mt-2" style={{ color: 'var(--text)' }}>{label}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--gray-400)' }}>{desc}</p>
                </button>
              )
            })}
          </div>

          {deliveryMethod === 'retiro' && (
            <p className="text-xs mt-3 flex items-start gap-1.5" style={{ color: 'var(--gray-600)' }}>
              <Info size={13} className="mt-0.5 shrink-0" />
              Cuando llegue tu producto te escribimos para coordinar el día. Entregamos los{' '}
              {PICKUP_SLOTS.map((s) => `${s.plural} de ${s.hours}`).join(' y los ')}.
            </p>
          )}

          {isDelivery && (
            <div className="mt-4 space-y-4">
              <div>
                <span className={labelCls} style={labelStyle}>Región</span>
                <div className="relative">
                  <select value={region} onChange={(e) => setRegion(e.target.value)} className="input-field appearance-none pr-10" required>
                    <option value="" disabled>Selecciona tu región</option>
                    {REGIONES_CHILE.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                  <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--gray-400)' }} />
                </div>
                {region && (
                  <p className="text-xs mt-2 font-semibold" style={{ color: shippingCost === 0 ? '#15803d' : 'var(--gray-600)' }}>
                    {shippingInfo.label} · {shippingCost === 0 ? 'Envío gratis' : `Envío ${formatPrice(shippingCost)}`}
                  </p>
                )}
              </div>
              <div>
                <span className={labelCls} style={labelStyle}>Comuna</span>
                <input value={commune} onChange={(e) => setCommune(e.target.value)} className="input-field" placeholder="Ej: Viña del Mar, Maipú..." required />
              </div>
              <div>
                <span className={labelCls} style={labelStyle}>Dirección</span>
                <input value={address} onChange={(e) => setAddress(e.target.value)} className="input-field" placeholder="Calle, número, depto/casa" autoComplete="street-address" required />
              </div>
              <div>
                <span className={labelCls} style={labelStyle}>Referencia (opcional)</span>
                <input value={reference} onChange={(e) => setReference(e.target.value)} className="input-field" placeholder="Casa azul, frente al banco..." />
              </div>
              <p className="text-xs flex items-start gap-1.5" style={{ color: 'var(--gray-400)' }}>
                <Info size={13} className="mt-0.5 shrink-0" />
                Lo despachamos apenas llegue el producto. El envío toma de 1 a 12 días hábiles según tu región,
                así que considéralo al elegir la fecha.
              </p>
            </div>
          )}
        </div>

        {/* Pago */}
        <div className="card p-5">
          <div className="flex items-center gap-3 mb-4">
            <span className={stepCls} style={stepStyle}>6</span>
            <h2 className="font-bold" style={{ color: 'var(--text)' }}>¿Cómo pagas?</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {([
              { id: 'mercadopago' as const, label: 'Mercado Pago', desc: 'Tarjeta de crédito o débito', icon: CreditCard },
              { id: 'transferencia' as const, label: 'Transferencia', desc: 'Te damos los datos al confirmar', icon: Landmark },
            ]).map(({ id, label, desc, icon: Icon }) => {
              const active = paymentMethod === id
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setPaymentMethod(id)}
                  className="text-left p-4 rounded-xl transition-all"
                  style={active
                    ? { border: '1.5px solid var(--red)', background: 'rgba(192,57,43,.04)' }
                    : { border: '1.5px solid var(--gray-200)', background: '#fff' }}
                >
                  <Icon size={18} style={{ color: active ? 'var(--red)' : 'var(--gray-400)' }} />
                  <p className="font-bold text-sm mt-2" style={{ color: 'var(--text)' }}>{label}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--gray-400)' }}>{desc}</p>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── Columna derecha: resumen pegajoso ── */}
      <div className="lg:sticky lg:top-24 space-y-4">
        <div className="card p-5">
          <div className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 mb-4"
            style={{ background: 'rgba(22,163,74,.1)', color: '#15803d' }}>
            <Tag size={13} />
            <span className="text-xs font-bold">15% de descuento por reservar</span>
          </div>

          <table className="w-full text-sm">
            <tbody>
              <tr>
                <td className="py-1.5" style={{ color: 'var(--gray-600)' }}>Precio normal</td>
                <td className="py-1.5 text-right tabular-nums" style={{ color: 'var(--gray-400)', textDecoration: 'line-through' }}>
                  {formatPrice(amounts.normal)}
                </td>
              </tr>
              <tr>
                <td className="py-1.5" style={{ color: 'var(--gray-600)' }}>Descuento (15%)</td>
                <td className="py-1.5 text-right tabular-nums font-semibold" style={{ color: '#15803d' }}>
                  −{formatPrice(amounts.discount)}
                </td>
              </tr>
              {deliveryMethod && (
                <tr>
                  <td className="py-1.5" style={{ color: 'var(--gray-600)' }}>
                    {isDelivery ? 'Envío' : 'Retiro en Maipú'}
                  </td>
                  <td className="py-1.5 text-right tabular-nums" style={{ color: 'var(--gray-600)' }}>
                    {isDelivery
                      ? (region ? (shippingCost === 0 ? 'Gratis' : formatPrice(shippingCost)) : 'Elige región')
                      : 'Gratis'}
                  </td>
                </tr>
              )}
              <tr>
                <td className="pt-3 font-bold" style={{ color: '#15803d', borderTop: '2px solid var(--text)' }}>
                  Total a pagar ahora
                </td>
                <td className="pt-3 text-right font-black tabular-nums text-lg" style={{ color: '#15803d', borderTop: '2px solid var(--text)' }}>
                  {formatPrice(total)}
                </td>
              </tr>
            </tbody>
          </table>

          {error && (
            <p className="text-sm mt-4 rounded-lg px-3 py-2" style={{ background: 'rgba(192,57,43,.08)', color: 'var(--red)' }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !canSubmit}
            className="btn-primary w-full justify-center py-4 mt-5 disabled:opacity-50"
          >
            {loading
              ? <><Loader2 size={18} className="animate-spin" /> Procesando...</>
              : <>Pagar {formatPrice(total)}</>}
          </button>

          {missingHint && (
            <p className="text-xs text-center mt-2" style={{ color: 'var(--gray-400)' }}>
              {missingHint}
            </p>
          )}
        </div>

        <div className="rounded-xl p-4 text-xs leading-relaxed"
          style={{ background: 'var(--gray-50)', color: 'var(--gray-600)' }}>
          <strong style={{ color: 'var(--text)' }}>Cómo funciona:</strong> pagas todo ahora (el producto
          con 15% de descuento, más el envío si lo eliges), conseguimos tu producto y te avisamos cuando
          llegue: si es envío lo despachamos de inmediato, y si es retiro coordinamos el día. No queda
          nada por pagar después.
        </div>
      </div>
    </form>
  )
}
