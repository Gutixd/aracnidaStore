import { createAdminClient } from '@/lib/supabase/server'
import { formatPrice } from '@/lib/utils'
import Link from 'next/link'
import { Package, Plus } from 'lucide-react'
import { AdminToggleProduct } from '@/components/admin/AdminToggleProduct'
import { AdminDeleteProduct } from '@/components/admin/AdminDeleteProduct'

async function getProducts() {
  const supabase = await createAdminClient()
  const { data } = await supabase
    .from('products')
    .select('*, category:categories(name), variants:product_variants(id, stock)')
    .order('created_at', { ascending: false })
  return data ?? []
}

export default async function AdminProductsPage() {
  const products = await getProducts()

  const th = "text-left p-4 text-xs font-bold uppercase tracking-wider"
  const thStyle = { color: 'var(--gray-400)' }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-8">
        <div>
          <h1 className="text-2xl font-black" style={{ color: 'var(--text)' }}>Productos</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--gray-600)' }}>{products.length} productos en catálogo</p>
        </div>
        <Link href="/admin/products/new" className="btn-primary text-sm">
          <Plus size={16} /> Nuevo producto
        </Link>
      </div>

      {/* En celular la tabla obligaba a arrastrar de lado para llegar a stock y
          a los botones. Bajo `lg` cada producto es una tarjeta con todo visible. */}
      <div className="lg:hidden space-y-3">
        {products.map((product) => {
          const numVariants = product.variants?.length ?? 0
          return (
            <div key={product.id} className="card p-4">
              <div className="flex items-start gap-3">
                <div className="w-14 h-14 rounded-lg overflow-hidden shrink-0" style={{ background: 'var(--gray-50)' }}>
                  {product.image_url && <img src={product.image_url} alt="" className="w-full h-full object-cover" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold leading-snug" style={{ color: 'var(--text)' }}>{product.name}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--gray-400)' }}>
                    {product.sku} · <span className="capitalize">{product.category?.name ?? 'sin categoría'}</span>
                  </p>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <span className="text-sm font-black tabular-nums" style={{ color: 'var(--text)' }}>{formatPrice(product.price)}</span>
                    <span className="text-xs font-bold tabular-nums px-2 py-0.5 rounded-md"
                      style={{
                        background: 'var(--gray-50)',
                        color: product.stock === 0 ? 'var(--red)' : product.stock <= 3 ? '#b45309' : '#15803d',
                      }}>
                      {product.stock} en stock
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-md font-medium" style={{ background: 'var(--gray-50)', color: 'var(--gray-600)' }}>
                      {numVariants} {numVariants === 1 ? 'variante' : 'variantes'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="mt-3 pt-3 flex items-center justify-between gap-2" style={{ borderTop: '1px solid var(--gray-100)' }}>
                <AdminToggleProduct id={product.id} active={product.active} name={product.name} />
                <div className="flex items-center gap-2">
                  <Link href={`/admin/products/${product.id}`} className="btn-ghost text-xs py-1.5 px-3">Editar</Link>
                  <AdminDeleteProduct id={product.id} name={product.name} />
                </div>
              </div>
            </div>
          )
        })}
        {products.length === 0 && (
          <div className="card p-10 text-center" style={{ color: 'var(--gray-400)' }}>
            <Package size={36} className="mx-auto mb-3" />
            <p className="text-sm">No hay productos. Crea el primero.</p>
          </div>
        )}
      </div>

      <div className="hidden lg:block card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--gray-100)' }}>
                <th className={th} style={thStyle}>Producto</th>
                <th className={th} style={thStyle}>Categoría</th>
                <th className={th} style={thStyle}>Variantes</th>
                <th className={th + ' text-right'} style={thStyle}>Precio</th>
                <th className={th + ' text-right'} style={thStyle}>Stock</th>
                <th className={th + ' text-center'} style={thStyle}>Estado</th>
                <th className={th + ' text-right'} style={thStyle}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => {
                const numVariants = product.variants?.length ?? 0
                return (
                  <tr key={product.id} style={{ borderTop: '1px solid var(--gray-50)' }}>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0" style={{ background: 'var(--gray-50)' }}>
                          {product.image_url && <img src={product.image_url} alt="" className="w-full h-full object-cover" />}
                        </div>
                        <div>
                          <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{product.name}</p>
                          <p className="text-xs" style={{ color: 'var(--gray-400)' }}>{product.sku}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-sm capitalize" style={{ color: 'var(--gray-600)' }}>{product.category?.name ?? '—'}</td>
                    <td className="p-4">
                      <span className="text-xs px-2 py-0.5 rounded-md font-medium" style={{ background: 'var(--gray-50)', color: 'var(--gray-600)' }}>
                        {numVariants} {numVariants === 1 ? 'variante' : 'variantes'}
                      </span>
                    </td>
                    <td className="p-4 text-right text-sm font-bold tabular-nums" style={{ color: 'var(--text)' }}>{formatPrice(product.price)}</td>
                    <td className="p-4 text-right">
                      <span className="text-sm font-black tabular-nums" style={{ color: product.stock === 0 ? 'var(--red)' : product.stock <= 3 ? '#b45309' : '#15803d' }}>
                        {product.stock}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <AdminToggleProduct id={product.id} active={product.active} name={product.name} />
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/admin/products/${product.id}`} className="btn-ghost text-xs py-1.5 px-3">Editar</Link>
                        <AdminDeleteProduct id={product.id} name={product.name} />
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {products.length === 0 && (
            <div className="p-16 text-center" style={{ color: 'var(--gray-400)' }}>
              <Package size={40} className="mx-auto mb-4" />
              <p>No hay productos. Crea el primero.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
