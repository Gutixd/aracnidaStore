import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { isAdmin } from '@/lib/auth/admin'
import { AdminChrome } from './AdminChrome'

// El panel nunca debe aparecer en buscadores, ni siquiera si alguien enlaza
// una URL interna desde fuera. robots.txt pide no rastrear; esto además pide
// no indexar aunque llegue por otro camino.
//
// El manifest y los ajustes "apple" solo se declaran aquí (no en el layout
// raíz) para que la tienda pública no ofrezca "instalar como app" — eso
// queda reservado al panel, que es lo único pensado para abrirse así.
export const metadata: Metadata = {
  robots: { index: false, follow: false, nocache: true },
  manifest: '/admin-manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Aracnida Admin',
  },
}

/**
 * `/admin/login` vive fuera de este layout a propósito (en el grupo de rutas
 * `(admin-auth)`), justamente para que este guardia pueda ser incondicional
 * sin dejar al usuario encerrado fuera del formulario de acceso.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Segunda barrera, además del middleware: si algún día cambia el matcher o
  // una ruta se sirve sin pasar por él, el panel sigue cerrado. Las páginas de
  // aquí dentro leen con la service role key (que ignora RLS), así que esta
  // comprobación en el servidor es la única protección real que tienen.
  if (!(await isAdmin())) {
    redirect('/admin/login?error=sin-permisos')
  }

  return <AdminChrome>{children}</AdminChrome>
}
