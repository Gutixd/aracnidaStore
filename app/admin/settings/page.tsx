import { createAdminClient } from '@/lib/supabase/server'
import { AdminSettingsForm } from '@/components/admin/AdminSettingsForm'

async function getSettings() {
  const supabase = await createAdminClient()
  const { data } = await supabase.from('settings').select('*').single()
  return data
}

export default async function AdminSettingsPage() {
  const settings = await getSettings()

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-black" style={{ color: 'var(--text)' }}>Configuración</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--gray-600)' }}>Ajustes generales de la tienda</p>
      </div>

      <div className="max-w-2xl">
        <AdminSettingsForm settings={settings} />
      </div>
    </div>
  )
}
