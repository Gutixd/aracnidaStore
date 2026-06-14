import { createAdminClient } from '@/lib/supabase/server'
import { formatPrice, formatDate } from '@/lib/utils'
import Link from 'next/link'

async function getData() {
  const supabase = await createAdminClient()
  const [{ data: products }, { data: movements }] = await Promise.all([
    supabase.from('products').select('*, category:categories(name)').order('stock', { ascending: true }),
    supabase.from('inventory_movements').select('*, product:products(name)').order('created_at', { ascending: false }).limit(50),
  ])
  return { products: products ?? [], movements: movements ?? [] }
}

export default async function AdminInventoryPage() {
  const { products, movements } = await getData()

  const totalInventoryCost = products.reduce((sum, p) => sum + Number(p.cost_price) * p.stock, 0)
  const totalInventoryValue = products.reduce((sum, p) => sum + Number(p.price) * p.stock, 0)
  const outOfStock = products.filter((p) => p.stock === 0).length
  const lowStock = products.filter((p) => p.stock > 0 && p.stock <= 3).length

  const typeLabel: Record<string, string> = { increase: 'Entrada', decrease: 'Salida', adjust: 'Ajuste', sale: 'Venta', return: 'Devolución' }
  const typeColor: Record<string, string> = { increase: '#15803d', decrease: 'var(--red)', adjust: 'var(--blue)', sale: '#7c3aed', return: '#b45309' }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-black" style={{ color: 'var(--text)' }}>Inventario</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--gray-600)' }}>Control de stock y movimientos</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Costo inventario', value: formatPrice(totalInventoryCost), sub: 'Valor al costo' },
          { label: 'Valor de venta', value: formatPrice(totalInventoryValue), sub: 'Precio de catálogo' },
          { label: 'Sin stock', value: String(outOfStock), sub: 'Productos agotados' },
          { label: 'Stock bajo', value: String(lowStock), sub: '3 o menos unidades' },
        ].map((s) => (
          <div key={s.label} className="stat-card">
            <p className="text-xs mb-2" style={{ color: 'var(--gray-400)' }}>{s.label}</p>
            <p className="text-xl font-black tabular-nums" style={{ color: 'var(--text)' }}>{s.value}</p>
            <p className="text-xs mt-1" style={{ color: 'var(--gray-400)' }}>{s.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 card overflow-hidden">
          <div className="p-5" style={{ borderBottom: '1px solid var(--gray-100)' }}>
            <h2 className="text-sm font-bold" style={{ color: 'var(--text)' }}>Stock por producto</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--gray-50)' }}>
                  {['Producto', 'Stock total', 'Costo unit.', 'Valor total', ''].map((h) => (
                    <th key={h} className="text-left p-4 text-xs font-bold uppercase" style={{ color: 'var(--gray-400)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id} style={{ borderTop: '1px solid var(--gray-50)' }}>
                    <td className="p-4">
                      <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{p.name}</p>
                      <p className="text-xs capitalize" style={{ color: 'var(--gray-400)' }}>{p.category?.name}</p>
                    </td>
                    <td className="p-4">
                      <span className="text-sm font-black tabular-nums" style={{ color: p.stock === 0 ? 'var(--red)' : p.stock <= 3 ? '#b45309' : '#15803d' }}>
                        {p.stock}
                      </span>
                    </td>
                    <td className="p-4 text-sm tabular-nums" style={{ color: 'var(--gray-600)' }}>{formatPrice(p.cost_price)}</td>
                    <td className="p-4 text-sm tabular-nums" style={{ color: 'var(--gray-600)' }}>{formatPrice(p.cost_price * p.stock)}</td>
                    <td className="p-4">
                      <Link href={`/admin/products/${p.id}`} className="text-xs font-semibold" style={{ color: 'var(--red)' }}>Gestionar</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card overflow-hidden">
          <div className="p-5" style={{ borderBottom: '1px solid var(--gray-100)' }}>
            <h2 className="text-sm font-bold" style={{ color: 'var(--text)' }}>Últimos movimientos</h2>
          </div>
          <div className="max-h-[600px] overflow-y-auto">
            {movements.map((m) => (
              <div key={m.id} className="p-4" style={{ borderTop: '1px solid var(--gray-50)' }}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold" style={{ color: typeColor[m.type] }}>{typeLabel[m.type]}</span>
                  <span className="text-xs" style={{ color: 'var(--gray-400)' }}>{formatDate(m.created_at)}</span>
                </div>
                <p className="text-sm truncate" style={{ color: 'var(--gray-800)' }}>{m.product?.name}</p>
                <div className="flex items-center gap-2 text-xs mt-1" style={{ color: 'var(--gray-400)' }}>
                  <span className="tabular-nums">{m.previous_stock} → <strong style={{ color: 'var(--gray-600)' }}>{m.new_stock}</strong></span>
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
