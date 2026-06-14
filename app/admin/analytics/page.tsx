import { createAdminClient } from '@/lib/supabase/server'
import { formatPrice, ORDER_STATUS_LABELS } from '@/lib/utils'

async function getAnalyticsData() {
  const supabase = await createAdminClient()

  const [{ data: orders }, { data: orderItems }, { data: products }, { data: expenses }] =
    await Promise.all([
      supabase.from('orders').select('total, subtotal, shipping_cost, status, created_at'),
      supabase.from('order_items').select('product_id, product_name, quantity, total_price'),
      supabase.from('products').select('id, name, stock, cost_price, price'),
      supabase.from('expenses').select('amount, category, created_at'),
    ])

  const validOrders = orders?.filter((o) => o.status !== 'cancelado') ?? []
  const totalSales = validOrders.reduce((sum, o) => sum + Number(o.total), 0)
  const totalOrders = validOrders.length
  const avgTicket = totalOrders > 0 ? totalSales / totalOrders : 0
  const totalExpenses = expenses?.reduce((sum, e) => sum + Number(e.amount), 0) ?? 0
  const netProfit = totalSales - totalExpenses

  const productSales = (orderItems ?? []).reduce((acc, item) => {
    const key = item.product_name
    if (!acc[key]) acc[key] = { name: key, quantity: 0, revenue: 0 }
    acc[key].quantity += item.quantity
    acc[key].revenue += Number(item.total_price)
    return acc
  }, {} as Record<string, { name: string; quantity: number; revenue: number }>)

  const topProducts = Object.values(productSales).sort((a, b) => b.revenue - a.revenue).slice(0, 5)

  const ordersByStatus = (orders ?? []).reduce((acc, o) => {
    acc[o.status] = (acc[o.status] ?? 0) + 1
    return acc
  }, {} as Record<string, number>)

  const now = new Date()
  const salesByDate = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(now)
    date.setDate(date.getDate() - (6 - i))
    const dateStr = date.toISOString().split('T')[0]
    const dayOrders = validOrders.filter((o) => o.created_at.startsWith(dateStr))
    const total = dayOrders.reduce((sum, o) => sum + Number(o.total), 0)
    return { date: dateStr, total, count: dayOrders.length }
  })

  const inventoryCost = (products ?? []).reduce((sum, p) => sum + Number(p.cost_price) * p.stock, 0)
  const inventoryValue = (products ?? []).reduce((sum, p) => sum + Number(p.price) * p.stock, 0)
  const inventoryMargin = inventoryCost > 0 ? ((inventoryValue - inventoryCost) / inventoryCost) * 100 : 0

  return { totalSales, totalOrders, avgTicket, netProfit, totalExpenses, topProducts, ordersByStatus, salesByDate, inventoryCost, inventoryValue, inventoryMargin }
}

export default async function AdminAnalyticsPage() {
  const data = await getAnalyticsData()
  const maxSale = Math.max(...data.salesByDate.map((d) => d.total), 1)

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-black" style={{ color: 'var(--text)' }}>Analytics</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--gray-600)' }}>Métricas y rendimiento de la tienda</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total ventas', value: formatPrice(data.totalSales), color: '#15803d' },
          { label: 'Pedidos', value: String(data.totalOrders), color: 'var(--blue)' },
          { label: 'Ticket promedio', value: formatPrice(data.avgTicket), color: '#7c3aed' },
          { label: 'Utilidad neta', value: formatPrice(data.netProfit), color: data.netProfit >= 0 ? '#15803d' : 'var(--red)' },
        ].map((kpi) => (
          <div key={kpi.label} className="stat-card">
            <p className="text-xs mb-2" style={{ color: 'var(--gray-400)' }}>{kpi.label}</p>
            <p className="text-xl font-black tabular-nums" style={{ color: kpi.color }}>{kpi.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
        <div className="card p-6">
          <h2 className="text-sm font-bold mb-6" style={{ color: 'var(--text)' }}>Ventas últimos 7 días</h2>
          <div className="flex items-end gap-2 h-40">
            {data.salesByDate.map((day) => {
              const height = maxSale > 0 ? (day.total / maxSale) * 100 : 0
              const dateLabel = new Date(day.date).toLocaleDateString('es-CL', { weekday: 'short', day: 'numeric' })
              return (
                <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full flex items-end justify-center" style={{ height: '120px' }}>
                    <div className="w-full rounded-t-md transition-all duration-500"
                      style={{
                        height: `${Math.max(height, day.total > 0 ? 4 : 0)}%`,
                        background: day.total > 0 ? 'linear-gradient(to top, #c0392b, #e74c3c)' : 'var(--gray-100)',
                        minHeight: day.total > 0 ? '4px' : '2px',
                      }} />
                  </div>
                  <span className="text-xs" style={{ color: 'var(--gray-400)' }}>{dateLabel}</span>
                  {day.total > 0 && <span className="text-xs tabular-nums" style={{ color: 'var(--gray-600)' }}>{formatPrice(day.total)}</span>}
                </div>
              )
            })}
          </div>
        </div>

        <div className="card p-6">
          <h2 className="text-sm font-bold mb-6" style={{ color: 'var(--text)' }}>Productos más vendidos</h2>
          <div className="space-y-4">
            {data.topProducts.length > 0 ? data.topProducts.map((p, i) => (
              <div key={p.name}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs w-4" style={{ color: 'var(--gray-400)' }}>{i + 1}</span>
                    <span className="text-sm truncate max-w-[180px]" style={{ color: 'var(--gray-800)' }}>{p.name}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold tabular-nums" style={{ color: 'var(--text)' }}>{formatPrice(p.revenue)}</p>
                    <p className="text-xs" style={{ color: 'var(--gray-400)' }}>{p.quantity} uds.</p>
                  </div>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--gray-100)' }}>
                  <div className="h-full rounded-full" style={{ width: `${(p.revenue / data.topProducts[0].revenue) * 100}%`, background: 'linear-gradient(to right, #c0392b, #e74c3c)' }} />
                </div>
              </div>
            )) : <p className="text-sm" style={{ color: 'var(--gray-400)' }}>Sin ventas registradas</p>}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="card p-6">
          <h2 className="text-sm font-bold mb-5" style={{ color: 'var(--text)' }}>Pedidos por estado</h2>
          <div className="space-y-3">
            {Object.entries(data.ordersByStatus).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between">
                <span className="text-sm" style={{ color: 'var(--gray-600)' }}>{ORDER_STATUS_LABELS[status] ?? status}</span>
                <span className="text-sm font-bold tabular-nums" style={{ color: 'var(--text)' }}>{count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="xl:col-span-2 card p-6">
          <h2 className="text-sm font-bold mb-5" style={{ color: 'var(--text)' }}>Valorización de inventario</h2>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-xs mb-1" style={{ color: 'var(--gray-400)' }}>Costo total</p>
              <p className="text-lg font-black tabular-nums" style={{ color: 'var(--text)' }}>{formatPrice(data.inventoryCost)}</p>
            </div>
            <div>
              <p className="text-xs mb-1" style={{ color: 'var(--gray-400)' }}>Valor de venta</p>
              <p className="text-lg font-black tabular-nums" style={{ color: 'var(--text)' }}>{formatPrice(data.inventoryValue)}</p>
            </div>
            <div>
              <p className="text-xs mb-1" style={{ color: 'var(--gray-400)' }}>Margen potencial</p>
              <p className="text-lg font-black tabular-nums" style={{ color: data.inventoryMargin >= 0 ? '#15803d' : 'var(--red)' }}>{data.inventoryMargin.toFixed(1)}%</p>
            </div>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-3">
            <div className="rounded-xl p-4" style={{ background: 'var(--gray-50)' }}>
              <p className="text-xs mb-1" style={{ color: 'var(--gray-400)' }}>Gastos totales</p>
              <p className="text-base font-bold tabular-nums" style={{ color: 'var(--red)' }}>{formatPrice(data.totalExpenses)}</p>
            </div>
            <div className="rounded-xl p-4" style={{ background: 'var(--gray-50)' }}>
              <p className="text-xs mb-1" style={{ color: 'var(--gray-400)' }}>Utilidad sobre ventas</p>
              <p className="text-base font-bold tabular-nums" style={{ color: '#15803d' }}>
                {data.totalSales > 0 ? ((data.netProfit / data.totalSales) * 100).toFixed(1) : 0}%
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
