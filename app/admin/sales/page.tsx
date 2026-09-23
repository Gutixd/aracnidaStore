import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/server'
import { formatPrice } from '@/lib/utils'
import {
  buildSalesReport, MONTH_NAMES,
  type ReportOrder, type Ranked,
} from '@/lib/sales-report'

export const dynamic = 'force-dynamic'

async function getData() {
  const supabase = await createAdminClient()
  const [{ data: orders }, { data: products }] = await Promise.all([
    supabase
      .from('orders')
      .select(
        'id, created_at, total, status, payment_status, payment_method, delivery_method, is_reservation, items:order_items(product_id, product_name, size, quantity, total_price)'
      )
      .eq('payment_status', 'pagado')
      .neq('status', 'cancelado'),
    supabase.from('products').select('id, category:categories(name)'),
  ])

  const categoryByProduct: Record<string, string> = {}
  for (const p of (products ?? []) as unknown as { id: string; category: { name: string } | null }[]) {
    if (p.category?.name) categoryByProduct[p.id] = p.category.name.charAt(0).toUpperCase() + p.category.name.slice(1)
  }
  return { orders: (orders ?? []) as unknown as ReportOrder[], categoryByProduct }
}

function href(year: number, month: number | null) {
  return month ? `/admin/sales?year=${year}&month=${month}` : `/admin/sales?year=${year}`
}

function RankedList({ title, subtitle, rows, unitLabel = 'uds.', limit = 8 }: {
  title: string
  subtitle?: string
  rows: Ranked[]
  unitLabel?: string
  limit?: number
}) {
  const shown = rows.slice(0, limit)
  const max = Math.max(...shown.map((r) => r.revenue), 1)
  return (
    <div className="card p-5">
      <h2 className="text-sm font-bold" style={{ color: 'var(--text)' }}>{title}</h2>
      {subtitle && <p className="text-xs mt-0.5 mb-4" style={{ color: 'var(--gray-400)' }}>{subtitle}</p>}
      {!subtitle && <div className="mb-4" />}
      {shown.length === 0 ? (
        <p className="text-sm" style={{ color: 'var(--gray-400)' }}>Sin ventas en este período</p>
      ) : (
        <div className="space-y-3.5">
          {shown.map((r, i) => (
            <div key={r.label}>
              <div className="flex items-start justify-between gap-3 mb-1.5">
                <div className="flex items-start gap-2 min-w-0">
                  <span className="text-xs w-4 shrink-0 mt-0.5 tabular-nums" style={{ color: 'var(--gray-400)' }}>{i + 1}</span>
                  <span className="text-sm leading-snug" style={{ color: 'var(--gray-800)' }}>{r.label}</span>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold tabular-nums" style={{ color: 'var(--text)' }}>{r.units} {unitLabel}</p>
                  <p className="text-xs tabular-nums" style={{ color: 'var(--gray-400)' }}>{formatPrice(r.revenue)}</p>
                </div>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--gray-100)' }}>
                <div className="h-full rounded-full"
                  style={{ width: `${(r.revenue / max) * 100}%`, background: 'linear-gradient(to right, #c0392b, #e74c3c)' }} />
              </div>
            </div>
          ))}
        </div>
      )}
      {rows.length > limit && (
        <p className="text-xs mt-4" style={{ color: 'var(--gray-400)' }}>+ {rows.length - limit} más con menos ventas</p>
      )}
    </div>
  )
}

export default async function AdminSalesPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; month?: string }>
}) {
  const sp = await searchParams
  const { orders, categoryByProduct } = await getData()

  const monthParam = Number(sp.month)
  const month = Number.isInteger(monthParam) && monthParam >= 1 && monthParam <= 12 ? monthParam : null
  const report = buildSalesReport(orders, categoryByProduct, sp.year ? Number(sp.year) : null, month)

  const maxRevenue = Math.max(...report.months.map((m) => m.revenue), 1)
  const periodLabel = report.month ? `${MONTH_NAMES[report.month - 1]} ${report.year}` : `Año ${report.year}`
  const noSales = report.totals.orders === 0

  const kpis = [
    { label: `Vendido · ${periodLabel}`, value: formatPrice(report.totals.revenue), color: '#15803d' },
    { label: 'Pedidos pagados', value: String(report.totals.orders), color: 'var(--blue)' },
    { label: 'Unidades', value: String(report.totals.units), color: '#7c3aed' },
    { label: 'Ticket promedio', value: formatPrice(report.totals.avgTicket), color: 'var(--text)' },
  ]

  const chip = (active: boolean) => ({
    background: active ? 'var(--red)' : 'var(--gray-50)',
    color: active ? '#fff' : 'var(--gray-600)',
    border: `1px solid ${active ? 'var(--red)' : 'var(--gray-100)'}`,
  })

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-black" style={{ color: 'var(--text)' }}>Ventas del año</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--gray-600)' }}>
          Cuánto vendiste mes a mes y qué se vendió más. Solo cuenta pedidos con el pago confirmado.
        </p>
      </div>

      {/* Filtros */}
      <div className="card p-4 mb-6 space-y-3">
        {report.years.length > 1 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wide w-12" style={{ color: 'var(--gray-400)' }}>Año</span>
            {report.years.map((y) => (
              <Link key={y} href={href(y, null)} className="px-3 py-1.5 rounded-lg text-sm font-semibold" style={chip(y === report.year)}>
                {y}
              </Link>
            ))}
          </div>
        )}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wide w-12" style={{ color: 'var(--gray-400)' }}>Ver</span>
          <Link href={href(report.year, null)} className="px-3 py-1.5 rounded-lg text-sm font-semibold" style={chip(report.month === null)}>
            Todo el año
          </Link>
          {report.months.map((m) => (
            <Link key={m.month} href={href(report.year, m.month)}
              className="px-3 py-1.5 rounded-lg text-sm font-semibold"
              style={{ ...chip(report.month === m.month), opacity: m.orders === 0 && report.month !== m.month ? 0.45 : 1 }}>
              {MONTH_NAMES[m.month - 1].slice(0, 3)}
            </Link>
          ))}
        </div>
      </div>

      {/* Resumen del período */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {kpis.map((k) => (
          <div key={k.label} className="stat-card">
            <p className="text-xs mb-2" style={{ color: 'var(--gray-400)' }}>{k.label}</p>
            <p className="text-xl font-black tabular-nums" style={{ color: k.color }}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Mes a mes */}
      <div className="card p-5 mb-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2 mb-5">
          <h2 className="text-sm font-bold" style={{ color: 'var(--text)' }}>Ventas mes a mes · {report.year}</h2>
          {report.bestMonth && (
            <p className="text-xs" style={{ color: 'var(--gray-400)' }}>
              Mejor mes: <strong style={{ color: 'var(--text)' }}>{MONTH_NAMES[report.bestMonth.month - 1]}</strong>{' '}
              ({formatPrice(report.bestMonth.revenue)})
            </p>
          )}
        </div>

        <div className="flex items-end gap-1 sm:gap-2" style={{ height: 150 }}>
          {report.months.map((m) => {
            const h = (m.revenue / maxRevenue) * 100
            const active = report.month === m.month
            return (
              <Link key={m.month} href={href(report.year, m.month)}
                className="flex-1 h-full flex flex-col justify-end items-center gap-1 group" title={`${MONTH_NAMES[m.month - 1]}: ${formatPrice(m.revenue)}`}>
                <div className="w-full rounded-t-md transition-opacity group-hover:opacity-80"
                  style={{
                    height: `${m.revenue > 0 ? Math.max(h, 3) : 0}%`,
                    minHeight: m.revenue > 0 ? 4 : 2,
                    background: m.revenue > 0
                      ? (active ? '#7c3aed' : 'linear-gradient(to top, #c0392b, #e74c3c)')
                      : 'var(--gray-100)',
                  }} />
              </Link>
            )
          })}
        </div>
        <div className="flex gap-1 sm:gap-2 mt-1.5">
          {report.months.map((m) => (
            <span key={m.month} className="flex-1 text-center text-[10px] sm:text-xs" style={{ color: 'var(--gray-400)' }}>
              {MONTH_NAMES[m.month - 1].slice(0, 3)}
            </span>
          ))}
        </div>

        {/* Detalle: en celular son filas, no columnas que obliguen a arrastrar */}
        <div className="mt-6 divide-y" style={{ borderTop: '1px solid var(--gray-100)' }}>
          {report.months.filter((m) => m.orders > 0).length === 0 ? (
            <p className="text-sm pt-4" style={{ color: 'var(--gray-400)' }}>Todavía no hay ventas pagadas en {report.year}.</p>
          ) : (
            report.months.filter((m) => m.orders > 0).map((m) => (
              <Link key={m.month} href={href(report.year, m.month)}
                className="flex items-center justify-between gap-3 py-3"
                style={{ borderColor: 'var(--gray-100)' }}>
                <div>
                  <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{MONTH_NAMES[m.month - 1]}</p>
                  <p className="text-xs" style={{ color: 'var(--gray-400)' }}>
                    {m.orders} {m.orders === 1 ? 'pedido' : 'pedidos'} · {m.units} {m.units === 1 ? 'unidad' : 'unidades'}
                  </p>
                </div>
                <p className="text-base font-black tabular-nums" style={{ color: 'var(--text)' }}>{formatPrice(m.revenue)}</p>
              </Link>
            ))
          )}
        </div>
      </div>

      {/* Qué se vendió */}
      <div className="mb-3">
        <h2 className="text-lg font-black" style={{ color: 'var(--text)' }}>Qué se vendió · {periodLabel}</h2>
        <p className="text-xs mt-0.5" style={{ color: 'var(--gray-400)' }}>
          Toca un mes arriba para ver solo ese mes. Los montos de producto no incluyen el envío.
        </p>
      </div>

      {noSales ? (
        <div className="card p-10 text-center" style={{ color: 'var(--gray-400)' }}>
          No hay ventas pagadas en este período.
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <RankedList title="Productos más vendidos" rows={report.products} limit={10} />
          <RankedList title="Tallas más vendidas" subtitle="Solo trajes y productos con talla" rows={report.sizes} unitLabel="uds." limit={10} />
          <RankedList title="Por tipo de producto" rows={report.categories} />
          <RankedList title="Cómo te pagaron" subtitle="Ventas del período por medio de pago" rows={report.payments} unitLabel="uds." />
          <RankedList title="Envío, retiro o reserva" subtitle="Monto = total cobrado al cliente" rows={report.channels} unitLabel="uds." />
        </div>
      )}
    </div>
  )
}
