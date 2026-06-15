import { createAdminClient } from '@/lib/supabase/server'
import { formatPrice } from '@/lib/utils'
import { StatCard } from '@/components/ui/card'
import {
  DollarSign, ShoppingCart, TrendingUp, Package,
  AlertTriangle, Clock, CheckCircle2, XCircle
} from 'lucide-react'
import { AdminRecentOrders } from '@/components/admin/AdminRecentOrders'
import { AdminLowStockAlert } from '@/components/admin/AdminLowStockAlert'

async function getDashboardData() {
  const supabase = await createAdminClient()

  const [
    { data: orders },
    { data: products },
    { data: expenses },
  ] = await Promise.all([
    supabase.from('orders').select('total, status, created_at').neq('status', 'cancelado'),
    supabase.from('products').select('stock, cost_price, price, active, name'),
    supabase.from('expenses').select('amount'),
  ])

  const totalSales = orders?.reduce((sum, o) => sum + Number(o.total), 0) ?? 0
  const totalOrders = orders?.length ?? 0
  const avgTicket = totalOrders > 0 ? totalSales / totalOrders : 0
  const pendingOrders = orders?.filter((o) => o.status === 'pendiente').length ?? 0

  const totalExpenses = expenses?.reduce((sum, e) => sum + Number(e.amount), 0) ?? 0
  const inventoryCost = products?.reduce((sum, p) => sum + Number(p.cost_price) * p.stock, 0) ?? 0
  const netProfit = totalSales - totalExpenses

  const lowStockProducts = products?.filter((p) => p.stock > 0 && p.stock <= 3) ?? []
  const outOfStockProducts = products?.filter((p) => p.stock === 0) ?? []
  const activeProducts = products?.filter((p) => p.active).length ?? 0

  return {
    totalSales,
    totalOrders,
    avgTicket,
    pendingOrders,
    totalExpenses,
    inventoryCost,
    netProfit,
    lowStockProducts,
    outOfStockProducts,
    activeProducts,
  }
}

export default async function AdminDashboard() {
  const data = await getDashboardData()

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-black" style={{ color: 'var(--text)' }}>Dashboard</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--gray-600)' }}>Resumen general de AracnidaStore</p>
      </div>

      {/* Alerts */}
      {(data.outOfStockProducts.length > 0 || data.lowStockProducts.length > 0) && (
        <div className="mb-6 space-y-3">
          {data.outOfStockProducts.length > 0 && (
            <div className="rounded-xl p-4 flex items-center gap-3" style={{ background: 'rgba(192,57,43,.06)', border: '1px solid rgba(192,57,43,.2)' }}>
              <XCircle size={18} className="shrink-0" style={{ color: 'var(--red)' }} />
              <p className="text-sm" style={{ color: 'var(--gray-800)' }}>
                <strong>{data.outOfStockProducts.length}</strong> producto(s) sin stock:{' '}
                {data.outOfStockProducts.slice(0, 3).map((p) => p.name).join(', ')}
                {data.outOfStockProducts.length > 3 && ` y ${data.outOfStockProducts.length - 3} más`}
              </p>
            </div>
          )}
          {data.lowStockProducts.length > 0 && (
            <div className="rounded-xl p-4 flex items-center gap-3" style={{ background: 'rgba(234,179,8,.08)', border: '1px solid rgba(234,179,8,.25)' }}>
              <AlertTriangle size={18} className="shrink-0" style={{ color: '#b45309' }} />
              <p className="text-sm" style={{ color: 'var(--gray-800)' }}>
                <strong>{data.lowStockProducts.length}</strong> producto(s) con stock bajo
              </p>
            </div>
          )}
        </div>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Total ventas"
          value={formatPrice(data.totalSales)}
          subtitle="Pedidos no cancelados"
          icon={<DollarSign size={20} />}
        />
        <StatCard
          title="Pedidos totales"
          value={String(data.totalOrders)}
          subtitle={`${data.pendingOrders} pendientes`}
          icon={<ShoppingCart size={20} />}
        />
        <StatCard
          title="Ticket promedio"
          value={formatPrice(data.avgTicket)}
          subtitle="Por pedido"
          icon={<TrendingUp size={20} />}
        />
        <StatCard
          title="Utilidad neta"
          value={formatPrice(data.netProfit)}
          subtitle={`Gastos: ${formatPrice(data.totalExpenses)}`}
          icon={<CheckCircle2 size={20} />}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Inventario valorizado"
          value={formatPrice(data.inventoryCost)}
          subtitle="Costo total stock"
          icon={<Package size={20} />}
        />
        <StatCard
          title="Productos activos"
          value={String(data.activeProducts)}
          subtitle="En catálogo"
          icon={<Package size={20} />}
        />
        <StatCard
          title="Stock bajo"
          value={String(data.lowStockProducts.length)}
          subtitle="Menos de 3 unidades"
          icon={<AlertTriangle size={20} />}
        />
        <StatCard
          title="Pedidos pendientes"
          value={String(data.pendingOrders)}
          subtitle="Sin confirmar"
          icon={<Clock size={20} />}
        />
      </div>

      {/* Tables */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <AdminRecentOrders />
        <AdminLowStockAlert />
      </div>
    </div>
  )
}
