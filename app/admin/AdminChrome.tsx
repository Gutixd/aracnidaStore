'use client'

import { AdminShell } from '@/components/admin/AdminShell'

/**
 * Marco visual del panel. El login no pasa por aquí: vive en el grupo de
 * rutas `(admin-auth)` y se muestra a pantalla completa, sin barra lateral.
 */
export function AdminChrome({ children }: { children: React.ReactNode }) {
  return <AdminShell>{children}</AdminShell>
}
