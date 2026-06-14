import { createAdminClient } from '@/lib/supabase/server'
import { formatPrice, formatDate } from '@/lib/utils'
import Link from 'next/link'
import { Archive, AlertTriangle } from 'lucide-react'

async function getData() {
  const supabase = await createAdminClient()
  const [{ data: products }, { data: movements }] = await Promise.all([
    supabase
      .from('products')
      .select('*, category:categories(name)')
      .order('stock', { ascending: true }),
    supabase
      .from('inventory_movements')
      .select('*, product:products(name)')
      .order('created_at', { ascending: false })
      .limit(50),
  ])
  return { products: products ?? [], movements: movements ?? [] }
}

export default async function AdminInventoryPage() {
  const { products, movements } = await getData()

  const totalInventoryCost = products.reduce(
    (sum, p) => sum + Number(p.cost_price) * p.stock, 0
  )
  const totalInventoryValue = products.reduce(
    (sum, p) => sum + Number(p.price) * p.stock, 0
  )
  const outOfStock = products.filter((p) => p.stock === 0).length
  const lowStock = products.filter((p) => p.stock > 0 && p.stock <= 3).length

  const typeLabel: Record<string, string> = {
    increase: 'Entrada', decrease: 'Salida', adjust: 'Ajuste', sale: 'Venta', return: 'Devolución'
  }
  const typeColor: Record<string, string> = {
    increase: 'text-green-400', decrease: 'text-red-400',
    adjust: 'text-blue-400', sale: 'text-purple-400', return: 'text-yellow-400'
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Inventario</h1>
        <p className="text-white/40 text-sm mt-1">Control de stock y movimientos</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Costo inventario', value: formatPrice(totalInventoryCost), sub: 'Valor al costo' },
          { label: 'Valor de venta', value: formatPrice(totalInventoryValue), sub: 'Precio de catálogo' },
          { label: 'Sin stock', value: String(outOfStock), sub: 'Productos agotados' },
          { label: 'Stock bajo', value: String(lowStock), sub: '≤ 3 unidades' },
        ].map((s) => (
          <div key={s.label} className="bg-[#111827] border border-white/5 rounded-xl p-5">
            <p className="text-xs text-white/40 mb-2">{s.label}</p>
            <p className="text-xl font-bold text-white">{s.value}</p>
            <p className="text-xs text-white/30 mt-1">{s.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Products stock table */}
        <div className="xl:col-span-2 bg-[#111827] border border-white/5 rounded-xl overflow-hidden">
          <div className="p-5 border-b border-white/5">
            <h2 className="text-sm font-semibold text-white">Stock por producto</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/[0.03]">
                  {['Producto', 'Talla', 'Stock', 'Costo unit.', 'Valor total', ''].map((h) => (
                    <th key={h} className="text-left p-4 text-xs font-medium text-white/30 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.03]">
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="p-4">
                      <p className="text-sm text-white/80">{p.name}</p>
                      <p className="text-xs text-white/30">{p.category?.name}</p>
                    </td>
                    <td className="p-4 text-sm text-white/50">{p.size}</td>
                    <td className="p-4">
                      <span className={`text-sm font-bold ${
                        p.stock === 0 ? 'text-red-400' : p.stock <= 3 ? 'text-yellow-400' : 'text-green-400'
                      }`}>
                        {p.stock === 0 ? '⚠ 0' : p.stock}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-white/50">{formatPrice(p.cost_price)}</td>
                    <td className="p-4 text-sm text-white/50">{formatPrice(p.cost_price * p.stock)}</td>
                    <td className="p-4">
                      <Link
                        href={`/admin/products/${p.id}`}
                        className="text-xs text-red-400 hover:text-red-300 transition-colors"
                      >
                        Gestionar
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Movement history */}
        <div className="bg-[#111827] border border-white/5 rounded-xl overflow-hidden">
          <div className="p-5 border-b border-white/5">
            <h2 className="text-sm font-semibold text-white">Últimos movimientos</h2>
          </div>
          <div className="divide-y divide-white/[0.03] max-h-[600px] overflow-y-auto">
            {movements.map((m) => (
              <div key={m.id} className="p-4">
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-xs font-semibold ${typeColor[m.type]}`}>
                    {typeLabel[m.type]}
                  </span>
                  <span className="text-xs text-white/20">{formatDate(m.created_at)}</span>
                </div>
                <p className="text-sm text-white/60 truncate">{m.product?.name}</p>
                <div className="flex items-center gap-2 text-xs text-white/30 mt-1">
                  <span>{m.previous_stock} → <strong className="text-white/50">{m.new_stock}</strong></span>
                  <span>·</span>
                  <span className="truncate">{m.reason}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
