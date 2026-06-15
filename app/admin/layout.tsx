'use client'

import { AdminShell } from '@/components/admin/AdminShell'
import { usePathname } from 'next/navigation'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  // El login se muestra a pantalla completa, sin sidebar
  if (pathname === '/admin/login') {
    return <>{children}</>
  }

  return <AdminShell>{children}</AdminShell>
}
