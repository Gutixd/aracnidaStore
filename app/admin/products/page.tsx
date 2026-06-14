import { createAdminClient } from '@/lib/supabase/server'
import { formatPrice } from '@/lib/utils'
import Link from 'next/link'
import { Package, Plus, Eye, EyeOff } from 'lucide-react'
import { AdminToggleProduct } from '@/components/admin/AdminToggleProduct'
import { AdminDeleteProduct } from '@/components/admin/AdminDeleteProduct'

async function getProducts() {
  const supabase = await createAdminClient()
  const { data } = await supabase
    .from('products')
    .select('*, category:categories(name)')
    .order('created_at', { ascending: false })
  return data ?? []
}

export default async function AdminProductsPage() {
  const products = await getProducts()

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Productos</h1>
          <p className="text-white/40 text-sm mt-1">{products.length} productos en total</p>
        </div>
        <Link
          href="/admin/products/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg font-semibold text-white text-sm transition-all"
          style={{ background: 'linear-gradient(135deg, #c0392b, #a93226)' }}
        >
          <Plus size={16} />
          Nuevo producto
        </Link>
      </div>

      <div className="bg-[#111827] border border-white/5 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left p-4 text-xs font-medium text-white/40 uppercase tracking-wider">Producto</th>
                <th className="text-left p-4 text-xs font-medium text-white/40 uppercase tracking-wider">Categoría</th>
                <th className="text-left p-4 text-xs font-medium text-white/40 uppercase tracking-wider">Talla/Color</th>
                <th className="text-right p-4 text-xs font-medium text-white/40 uppercase tracking-wider">Precio</th>
                <th className="text-right p-4 text-xs font-medium text-white/40 uppercase tracking-wider">Costo</th>
                <th className="text-right p-4 text-xs font-medium text-white/40 uppercase tracking-wider">Stock</th>
                <th className="text-center p-4 text-xs font-medium text-white/40 uppercase tracking-wider">Estado</th>
                <th className="text-right p-4 text-xs font-medium text-white/40 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.03]">
              {products.map((product) => (
                <tr key={product.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-[#0d1117] rounded-lg overflow-hidden shrink-0">
                        {product.image_url && (
                          <img src={product.image_url} alt="" className="w-full h-full object-cover" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white/80">{product.name}</p>
                        <p className="text-xs text-white/30">{product.sku}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-sm text-white/50 capitalize">
                    {product.category?.name ?? '—'}
                  </td>
                  <td className="p-4">
                    <div className="flex gap-1.5">
                      <span className="text-xs bg-white/5 text-white/50 px-2 py-0.5 rounded">{product.size}</span>
                      <span className="text-xs bg-white/5 text-white/50 px-2 py-0.5 rounded capitalize">{product.color}</span>
                    </div>
                  </td>
                  <td className="p-4 text-right text-sm font-semibold text-white">{formatPrice(product.price)}</td>
                  <td className="p-4 text-right text-sm text-white/40">{formatPrice(product.cost_price)}</td>
                  <td className="p-4 text-right">
                    <span className={`text-sm font-bold ${
                      product.stock === 0 ? 'text-red-400' : product.stock <= 3 ? 'text-yellow-400' : 'text-green-400'
                    }`}>
                      {product.stock}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <AdminToggleProduct id={product.id} active={product.active} name={product.name} />
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/admin/products/${product.id}`}
                        className="text-xs text-white/40 hover:text-white/80 bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg transition-all"
                      >
                        Editar
                      </Link>
                      <AdminDeleteProduct id={product.id} name={product.name} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {products.length === 0 && (
            <div className="p-16 text-center text-white/30">
              <Package size={40} className="mx-auto mb-4 opacity-30" />
              <p>No hay productos. Crea el primero.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
