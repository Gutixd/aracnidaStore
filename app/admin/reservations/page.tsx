import { createAdminClient } from '@/lib/supabase/server'
import { formatPrice, formatDate, PAYMENT_METHOD_LABELS, PAYMENT_STATUS_LABELS, PAYMENT_STATUS_COLORS } from '@/lib/utils'
import {
  RESERVATION_STATUS_LABELS, RESERVATION_STATUS_COLORS,
  formatReservationDate, parseISODate,
} from '@/lib/reservations'
import { Order } from '@/types'
import { AdminReservationControls } from '@/components/admin/AdminReservationControls'
import { CalendarDays, AlertTriangle, Clock } from 'lucide-react'

export const dynamic = 'force-dynamic'

async function getReservations(): Promise<Order[]> {
  const supabase = await createAdminClient()
  const { data } = await supabase
    .from('orders')
    .select('*, items:order_items(*)')
    .eq('is_reservation', true)
    .order('created_at', { ascending: false })
  return data ?? []
}

/** Días que faltan para la fecha en que el cliente necesita el producto. */
function daysUntil(dateStr: string | null | undefined): number | null {
  if (!dateStr) return null
  const target = parseISODate(dateStr)
  if (!target) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Math.round((target.getTime() - today.getTime()) / 86_400_000)
}

export default async function AdminReservationsPage() {
  const reservations = await getReservations()

  const activas = reservations.filter((r) => r.status !== 'cancelado' && r.status !== 'entregado')
  const porConfirmar = reservations.filter((r) => r.payment_status === 'pendiente' && r.status !== 'cancelado')
  const saldoPorCobrar = reservations.filter((r) => r.payment_status === 'abonado' && r.status !== 'cancelado')
  const totalSaldo = saldoPorCobrar.reduce((s, r) => s + Number(r.balance_due ?? 0), 0)
  const totalAbonado = reservations
    .filter((r) => r.status !== 'cancelado' && (r.payment_status === 'abonado' || r.payment_status === 'pagado'))
    .reduce((s, r) => s + Number(r.deposit_amount ?? 0), 0)

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-black" style={{ color: 'var(--text)' }}>Reservas</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--gray-600)' }}>
          {reservations.length} reservas · {activas.length} activas
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Activas', value: String(activas.length), color: 'var(--blue)' },
          { label: 'Abonos recibidos', value: formatPrice(totalAbonado), color: '#15803d' },
          { label: 'Saldo por cobrar', value: formatPrice(totalSaldo), color: '#b45309' },
          { label: 'Por confirmar', value: String(porConfirmar.length), color: porConfirmar.length ? 'var(--red)' : 'var(--gray-400)' },
        ].map((kpi) => (
          <div key={kpi.label} className="stat-card">
            <p className="text-xs mb-2" style={{ color: 'var(--gray-400)' }}>{kpi.label}</p>
            <p className="text-xl font-black tabular-nums" style={{ color: kpi.color }}>{kpi.value}</p>
          </div>
        ))}
      </div>

      {porConfirmar.length > 0 && (
        <div className="mb-8 rounded-xl p-4 flex items-center gap-3 border bg-amber-50 border-amber-200">
          <AlertTriangle size={18} className="text-amber-600 shrink-0" />
          <p className="text-sm text-amber-800">
            <strong>{porConfirmar.length}</strong>{' '}
            {porConfirmar.length === 1 ? 'reserva espera' : 'reservas esperan'} confirmación del abono.
          </p>
        </div>
      )}

      <div className="space-y-4">
        {reservations.length === 0 && (
          <div className="card p-16 text-center" style={{ color: 'var(--gray-400)' }}>
            <CalendarDays size={40} className="mx-auto mb-4" />
            <p>Sin reservas todavía</p>
          </div>
        )}

        {reservations.map((r) => {
          const dias = daysUntil(r.needed_by)
          const urgente = dias !== null && dias <= 7 && r.status !== 'entregado' && r.status !== 'cancelado'

          return (
            <div key={r.id} className="card overflow-hidden">
              <div className="p-5 flex flex-wrap items-center justify-between gap-4"
                style={{ borderBottom: '1px solid var(--gray-100)' }}>
                <div>
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-mono text-xs" style={{ color: 'var(--gray-400)' }}>
                      #{r.id.slice(0, 8).toUpperCase()}
                    </span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${RESERVATION_STATUS_COLORS[r.status] ?? ''}`}>
                      {RESERVATION_STATUS_LABELS[r.status] ?? r.status}
                    </span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${PAYMENT_STATUS_COLORS[r.payment_status] ?? ''}`}>
                      {PAYMENT_STATUS_LABELS[r.payment_status] ?? r.payment_status}
                    </span>
                    {urgente && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border bg-red-50 text-red-700 border-red-200">
                        <Clock size={11} />
                        {dias! < 0 ? `Atrasada ${Math.abs(dias!)}d` : dias === 0 ? 'Es hoy' : `Faltan ${dias}d`}
                      </span>
                    )}
                  </div>
                  <p className="font-bold" style={{ color: 'var(--text)' }}>{r.customer_name}</p>
                  <div className="flex items-center gap-3 text-xs mt-0.5 flex-wrap" style={{ color: 'var(--gray-400)' }}>
                    <span>{r.customer_phone}</span><span>·</span>
                    <span>{r.customer_email}</span><span>·</span>
                    <span>Reservada {formatDate(r.created_at)}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-black tabular-nums" style={{ color: 'var(--text)' }}>
                    {formatPrice(r.total)}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--gray-400)' }}>
                    con 15% de descuento
                  </p>
                </div>
              </div>

              <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-5">
                <div>
                  <p className="text-xs uppercase tracking-wider mb-3 font-bold" style={{ color: 'var(--gray-400)' }}>
                    Producto a conseguir
                  </p>
                  <div className="space-y-1.5">
                    {r.items?.map((item) => (
                      <p key={item.id} className="text-sm" style={{ color: 'var(--gray-800)' }}>
                        {item.product_name}<br />
                        <span style={{ color: 'var(--gray-400)' }}>Talla {item.size} × {item.quantity}</span>
                      </p>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-wider mb-3 font-bold" style={{ color: 'var(--gray-400)' }}>
                    Lo necesita para
                  </p>
                  <p className="text-sm font-semibold capitalize" style={{ color: 'var(--text)' }}>
                    {r.needed_by ? formatReservationDate(r.needed_by) : '—'}
                  </p>
                  <p className="text-xs mt-2" style={{ color: 'var(--gray-400)' }}>
                    Pagó con {PAYMENT_METHOD_LABELS[r.payment_method ?? ''] ?? r.payment_method ?? '—'}
                  </p>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-wider mb-3 font-bold" style={{ color: 'var(--gray-400)' }}>
                    Montos
                  </p>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span style={{ color: 'var(--gray-600)' }}>Precio normal</span>
                      <span className="tabular-nums" style={{ color: 'var(--gray-400)', textDecoration: 'line-through' }}>
                        {formatPrice(r.subtotal)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span style={{ color: 'var(--gray-600)' }}>Descuento</span>
                      <span className="tabular-nums" style={{ color: '#15803d' }}>−{formatPrice(r.discount)}</span>
                    </div>
                    <div className="flex justify-between font-semibold">
                      <span style={{ color: '#15803d' }}>Abono</span>
                      <span className="tabular-nums" style={{ color: '#15803d' }}>
                        {formatPrice(Number(r.deposit_amount ?? 0))}
                      </span>
                    </div>
                    <div className="flex justify-between font-semibold">
                      <span style={{ color: '#b45309' }}>Saldo</span>
                      <span className="tabular-nums" style={{ color: '#b45309' }}>
                        {formatPrice(Number(r.balance_due ?? 0))}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="px-5 pb-5 flex flex-wrap items-end justify-between gap-4">
                {r.notes && (
                  <p className="text-xs rounded-lg px-3 py-2"
                    style={{ background: 'var(--gray-50)', color: 'var(--gray-600)', border: '1px solid var(--gray-100)' }}>
                    Nota: {r.notes}
                  </p>
                )}
                <div className="ml-auto">
                  <AdminReservationControls
                    reservationId={r.id}
                    currentStatus={r.status}
                    paymentStatus={r.payment_status}
                    paymentMethod={r.payment_method ?? null}
                  />
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
