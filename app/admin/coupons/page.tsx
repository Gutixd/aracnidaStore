import { createAdminClient } from '@/lib/supabase/server'
import { formatPrice } from '@/lib/utils'
import { describeCoupon, type Coupon } from '@/lib/coupons'
import { AdminCouponForm } from '@/components/admin/AdminCouponForm'
import { AdminCouponActions } from '@/components/admin/AdminCouponActions'
import { Ticket } from 'lucide-react'

export const dynamic = 'force-dynamic'

type Estado = { label: string; bg: string; color: string }

function estadoDe(c: Coupon, usos: number): Estado {
  const now = Date.now()
  if (!c.active) return { label: 'Desactivado', bg: 'var(--gray-100)', color: 'var(--gray-600)' }
  if (c.expires_at && new Date(c.expires_at).getTime() < now) return { label: 'Expirado', bg: 'var(--gray-100)', color: 'var(--gray-600)' }
  if (c.max_uses && usos >= c.max_uses) return { label: 'Agotado', bg: 'rgba(180,83,9,.1)', color: '#b45309' }
  if (c.starts_at && new Date(c.starts_at).getTime() > now) return { label: 'Programado', bg: 'rgba(37,99,235,.08)', color: '#1d4ed8' }
  return { label: 'Activo', bg: 'rgba(22,163,74,.1)', color: '#15803d' }
}

function fecha(iso: string | null) {
  return iso
    ? new Date(iso).toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'America/Santiago' })
    : null
}

export default async function AdminCouponsPage() {
  const supabase = await createAdminClient()
  const [{ data: coupons }, { data: usados }] = await Promise.all([
    supabase.from('coupons').select('*').order('created_at', { ascending: false }),
    supabase.from('orders').select('coupon_code, discount, payment_status').not('coupon_code', 'is', null).neq('status', 'cancelado'),
  ])

  // Uso por código: pedidos vigentes, cuántos ya pagados y cuánto se descontó.
  const stats = new Map<string, { usos: number; pagados: number; descontado: number }>()
  for (const o of usados ?? []) {
    const s = stats.get(o.coupon_code) ?? { usos: 0, pagados: 0, descontado: 0 }
    s.usos += 1
    if (o.payment_status === 'pagado') {
      s.pagados += 1
      s.descontado += Number(o.discount)
    }
    stats.set(o.coupon_code, s)
  }

  const lista = (coupons ?? []) as Coupon[]
  const totalDescontado = [...stats.values()].reduce((a, s) => a + s.descontado, 0)
  const totalPagados = [...stats.values()].reduce((a, s) => a + s.pagados, 0)
  const activos = lista.filter((c) => estadoDe(c, stats.get(c.code)?.usos ?? 0).label === 'Activo').length

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-black" style={{ color: 'var(--text)' }}>Cupones</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--gray-600)' }}>
          Códigos de descuento para tus clientes. Se aplican en el checkout sobre el total de productos (no sobre el envío).
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        {[
          { label: 'Cupones activos', value: String(activos) },
          { label: 'Ventas pagadas con cupón', value: String(totalPagados) },
          { label: 'Total descontado', value: formatPrice(totalDescontado) },
        ].map((k) => (
          <div key={k.label} className="stat-card">
            <p className="text-xs mb-2" style={{ color: 'var(--gray-400)' }}>{k.label}</p>
            <p className="text-xl font-black tabular-nums" style={{ color: 'var(--text)' }}>{k.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[380px_1fr] gap-6 items-start">
        <AdminCouponForm />

        <div className="space-y-3">
          {lista.length === 0 ? (
            <div className="card p-10 text-center">
              <Ticket size={36} className="mx-auto mb-3" style={{ color: 'var(--gray-200)' }} />
              <p className="font-semibold" style={{ color: 'var(--text)' }}>Todavía no hay cupones</p>
              <p className="text-sm mt-1" style={{ color: 'var(--gray-400)' }}>Crea el primero con el formulario.</p>
            </div>
          ) : (
            lista.map((c) => {
              const s = stats.get(c.code) ?? { usos: 0, pagados: 0, descontado: 0 }
              const estado = estadoDe(c, s.usos)
              const reglas = [
                Number(c.min_subtotal) > 0 ? `Compra mínima ${formatPrice(c.min_subtotal)}` : null,
                c.once_per_customer ? 'Un uso por cliente' : null,
                fecha(c.starts_at) ? `Desde ${fecha(c.starts_at)}` : null,
                fecha(c.expires_at) ? `Hasta ${fecha(c.expires_at)}` : 'Sin vencimiento',
              ].filter(Boolean)

              return (
                <div key={c.id} className="card p-4 sm:p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-base font-bold tracking-wider px-2.5 py-1 rounded-md"
                          style={{ background: 'var(--gray-50)', color: 'var(--text)', boxShadow: 'inset 0 0 0 1px var(--gray-200)' }}>
                          {c.code}
                        </span>
                        <span className="text-xs font-semibold px-2 py-1 rounded-md" style={{ background: estado.bg, color: estado.color }}>
                          {estado.label}
                        </span>
                      </div>
                      <p className="text-lg font-bold mt-2" style={{ color: 'var(--text)' }}>{describeCoupon(c)}</p>
                      <p className="text-xs mt-1" style={{ color: 'var(--gray-400)' }}>{reglas.join(' · ')}</p>
                      {c.note && <p className="text-xs mt-1 italic" style={{ color: 'var(--gray-600)' }}>{c.note}</p>}
                    </div>
                    <AdminCouponActions id={c.id} active={c.active} used={s.usos > 0} />
                  </div>

                  <div className="mt-4 pt-3 grid grid-cols-3 gap-2 text-center" style={{ borderTop: '1px solid var(--gray-100)' }}>
                    <div>
                      <p className="text-base font-bold tabular-nums" style={{ color: 'var(--text)' }}>
                        {s.usos}{c.max_uses ? <span style={{ color: 'var(--gray-400)', fontWeight: 400 }}> / {c.max_uses}</span> : null}
                      </p>
                      <p className="text-[11px]" style={{ color: 'var(--gray-400)' }}>Usos</p>
                    </div>
                    <div>
                      <p className="text-base font-bold tabular-nums" style={{ color: 'var(--text)' }}>{s.pagados}</p>
                      <p className="text-[11px]" style={{ color: 'var(--gray-400)' }}>Pagados</p>
                    </div>
                    <div>
                      <p className="text-base font-bold tabular-nums" style={{ color: '#15803d' }}>{formatPrice(s.descontado)}</p>
                      <p className="text-[11px]" style={{ color: 'var(--gray-400)' }}>Descontado</p>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
