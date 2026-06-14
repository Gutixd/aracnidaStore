'use client'

import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { usePathname } from 'next/navigation'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  // El login se muestra a pantalla completa, sin sidebar
  if (pathname === '/admin/login') {
    return <>{children}</>
  }

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--gray-50)' }}>
      <AdminSidebar />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  )
}
