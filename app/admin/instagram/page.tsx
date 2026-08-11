import { getInstagramPosts } from '@/lib/actions/instagram'
import { AdminInstagramForm } from '@/components/admin/AdminInstagramForm'
import { AdminInstagramBulkUpload } from '@/components/admin/AdminInstagramBulkUpload'
import { AdminInstagramQueue } from '@/components/admin/AdminInstagramQueue'
import { isInstagramEnabled } from '@/lib/instagram'
import { isClaudeEnabled } from '@/lib/claude'
import { Camera, AlertTriangle } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function AdminInstagramPage() {
  const posts = await getInstagramPosts()
  const pendientes = posts.filter((p) => p.status === 'pendiente')
  const publicados = posts.filter((p) => p.status === 'publicado')
  const errores = posts.filter((p) => p.status === 'error')

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-black flex items-center gap-2" style={{ color: 'var(--text)' }}>
          <Camera size={22} /> Instagram
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--gray-400)' }}>
          Programa una publicación y se sube sola. Se revisa una vez al día
          (al mediodía en Chile aprox.), así que si programas algo para hoy
          puede tardar unas horas en salir.
        </p>
      </div>

      {!isInstagramEnabled() && (
        <div className="card p-5 mb-6 flex items-start gap-3"
          style={{ background: 'rgba(217,119,6,.08)', border: '1px solid rgba(217,119,6,.25)' }}>
          <AlertTriangle size={18} className="mt-0.5 shrink-0" style={{ color: '#d97706' }} />
          <div>
            <p className="font-semibold text-sm" style={{ color: 'var(--text)' }}>
              Falta conectar la cuenta de Instagram
            </p>
            <p className="text-sm mt-1" style={{ color: 'var(--gray-600)' }}>
              Puedes programar publicaciones igual, pero no se van a subir hasta que
              INSTAGRAM_ACCESS_TOKEN e INSTAGRAM_BUSINESS_ACCOUNT_ID estén configurados en Vercel.
            </p>
          </div>
        </div>
      )}

      {isClaudeEnabled() && <AdminInstagramBulkUpload />}

      <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6">
        <AdminInstagramForm />
        <AdminInstagramQueue pendientes={pendientes} publicados={publicados} errores={errores} />
      </div>
    </div>
  )
}
