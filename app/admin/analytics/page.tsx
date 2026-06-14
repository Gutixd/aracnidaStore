import { createAdminClient } from '@/lib/supabase/server'
import { formatPrice, ORDER_STATUS_LABELS } from '@/lib/utils'
import { BarChart2 } from 'lucide-react'

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

  // Top products
  const productSales = (orderItems ?? []).reduce((acc, item) => {
    const key = item.product_name
    if (!acc[key]) acc[key] = { name: key, quantity: 0, revenue: 0 }
    acc[key].quantity += item.quantity
    acc[key].revenue += Number(item.total_price)
    return acc
  }, {} as Record<string, { name: string; quantity: number; revenue: number }>)

  const topProducts = Object.values(productSales)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5)

  // Orders by status
  const ordersByStatus = (orders ?? []).reduce((acc, o) => {
    acc[o.status] = (acc[o.status] ?? 0) + 1
    return acc
  }, {} as Record<string, number>)

  // Sales by date (last 7 days)
  const now = new Date()
  const salesByDate = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(now)
    date.setDate(date.getDate() - (6 - i))
    const dateStr = date.toISOString().split('T')[0]
    const dayOrders = validOrders.filter((o) => o.created_at.startsWith(dateStr))
    const total = dayOrders.reduce((sum, o) => sum + Number(o.total), 0)
    return { date: dateStr, total, count: dayOrders.length }
  })

  // Inventory valuation
  const inventoryCost = (products ?? []).reduce((sum, p) => sum + Number(p.cost_price) * p.stock, 0)
  const inventoryValue = (products ?? []).reduce((sum, p) => sum + Number(p.price) * p.stock, 0)
  const inventoryMargin = inventoryCost > 0 ? ((inventoryValue - inventoryCost) / inventoryCost) * 100 : 0

  return {
    totalSales,
    totalOrders,
    avgTicket,
    netProfit,
    totalExpenses,
    topProducts,
    ordersByStatus,
    salesByDate,
    inventoryCost,
    inventoryValue,
    inventoryMargin,
  }
}

export default async function AdminAnalyticsPage() {
  const data = await getAnalyticsData()
  const maxSale = Math.max(...data.salesByDate.map((d) => d.total), 1)

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Analytics</h1>
        <p className="text-white/40 text-sm mt-1">Métricas y rendimiento de la tienda</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total ventas', value: formatPrice(data.totalSales), color: 'text-green-400' },
          { label: 'Pedidos', value: String(data.totalOrders), color: 'text-blue-400' },
          { label: 'Ticket promedio', value: formatPrice(data.avgTicket), color: 'text-purple-400' },
          { label: 'Utilidad neta', value: formatPrice(data.netProfit), color: data.netProfit >= 0 ? 'text-green-400' : 'text-red-400' },
        ].map((kpi) => (
          <div key={kpi.label} className="bg-[#111827] border border-white/5 rounded-xl p-5">
            <p className="text-xs text-white/40 mb-2">{kpi.label}</p>
            <p className={`text-xl font-black ${kpi.color}`}>{kpi.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
        {/* Sales chart (7 days) */}
        <div className="bg-[#111827] border border-white/5 rounded-xl p-6">
          <h2 className="text-sm font-semibold text-white mb-6">Ventas últimos 7 días</h2>
          <div className="flex items-end gap-2 h-40">
            {data.salesByDate.map((day) => {
              const height = maxSale > 0 ? (day.total / maxSale) * 100 : 0
              const dateLabel = new Date(day.date).toLocaleDateString('es-CL', { weekday: 'short', day: 'numeric' })
              return (
                <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full flex items-end justify-center" style={{ height: '120px' }}>
                    <div
                      className="w-full rounded-t-md transition-all duration-500"
                      style={{
                        height: `${Math.max(height, day.total > 0 ? 4 : 0)}%`,
                        background: day.total > 0
                          ? 'linear-gradient(to top, #c0392b, #e74c3c)'
                          : 'rgba(255,255,255,0.05)',
                        minHeight: day.total > 0 ? '4px' : '2px',
                      }}
                    />
                  </div>
                  <span className="text-xs text-white/30">{dateLabel}</span>
                  {day.total > 0 && (
                    <span className="text-xs text-white/50">{formatPrice(day.total)}</span>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Top products */}
        <div className="bg-[#111827] border border-white/5 rounded-xl p-6">
          <h2 className="text-sm font-semibold text-white mb-6">Productos más vendidos</h2>
          <div className="space-y-4">
            {data.topProducts.length > 0 ? data.topProducts.map((p, i) => (
              <div key={p.name}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-white/30 w-4">{i + 1}</span>
                    <span className="text-sm text-white/70 truncate max-w-[180px]">{p.name}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-white">{formatPrice(p.revenue)}</p>
                    <p className="text-xs text-white/30">{p.quantity} uds.</p>
                  </div>
                </div>
                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${(p.revenue / data.topProducts[0].revenue) * 100}%`,
                      background: 'linear-gradient(to right, #c0392b, #e74c3c)',
                    }}
                  />
                </div>
              </div>
            )) : (
              <p className="text-white/30 text-sm">Sin ventas registradas</p>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Orders by status */}
        <div className="bg-[#111827] border border-white/5 rounded-xl p-6">
          <h2 className="text-sm font-semibold text-white mb-5">Pedidos por estado</h2>
          <div className="space-y-3">
            {Object.entries(data.ordersByStatus).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between">
                <span className="text-sm text-white/50">{ORDER_STATUS_LABELS[status] ?? status}</span>
                <span className="text-sm font-bold text-white">{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Inventory metrics */}
        <div className="xl:col-span-2 bg-[#111827] border border-white/5 rounded-xl p-6">
          <h2 className="text-sm font-semibold text-white mb-5">Valorización de inventario</h2>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-white/40 mb-1">Costo total</p>
              <p className="text-lg font-bold text-white">{formatPrice(data.inventoryCost)}</p>
            </div>
            <div>
              <p className="text-xs text-white/40 mb-1">Valor de venta</p>
              <p className="text-lg font-bold text-white">{formatPrice(data.inventoryValue)}</p>
            </div>
            <div>
              <p className="text-xs text-white/40 mb-1">Margen potencial</p>
              <p className={`text-lg font-bold ${data.inventoryMargin >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {data.inventoryMargin.toFixed(1)}%
              </p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <div className="bg-white/[0.02] rounded-xl p-4">
              <p className="text-xs text-white/40 mb-1">Gastos totales</p>
              <p className="text-base font-semibold text-red-400">{formatPrice(data.totalExpenses)}</p>
            </div>
            <div className="bg-white/[0.02] rounded-xl p-4">
              <p className="text-xs text-white/40 mb-1">Utilidad sobre ventas</p>
              <p className="text-base font-semibold text-green-400">
                {data.totalSales > 0 ? ((data.netProfit / data.totalSales) * 100).toFixed(1) : 0}%
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
