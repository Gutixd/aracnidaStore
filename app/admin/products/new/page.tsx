import { createAdminClient } from '@/lib/supabase/server'
import { AdminProductForm } from '@/components/admin/AdminProductForm'

export default async function NewProductPage() {
  const supabase = await createAdminClient()
  const { data: categories } = await supabase.from('categories').select('*')

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-black" style={{ color: 'var(--text)' }}>Nuevo producto</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--gray-600)' }}>Agrega un producto al catálogo</p>
      </div>
      <div className="max-w-2xl">
        <AdminProductForm product={null} categories={categories ?? []} />
      </div>
    </div>
  )
}
