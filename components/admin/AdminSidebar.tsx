'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  LayoutDashboard, Package, ShoppingCart, Archive,
  DollarSign, BarChart2, Settings, LogOut, ExternalLink,
} from 'lucide-react'

const NAV_ITEMS = [
  { href: '/admin', label: 'Dashboard', icon: <LayoutDashboard size={18} />, exact: true },
  { href: '/admin/orders', label: 'Pedidos', icon: <ShoppingCart size={18} /> },
  { href: '/admin/products', label: 'Productos', icon: <Package size={18} /> },
  { href: '/admin/inventory', label: 'Inventario', icon: <Archive size={18} /> },
  { href: '/admin/expenses', label: 'Gastos', icon: <DollarSign size={18} /> },
  { href: '/admin/analytics', label: 'Analytics', icon: <BarChart2 size={18} /> },
  { href: '/admin/settings', label: 'Configuración', icon: <Settings size={18} /> },
]

export function AdminSidebar() {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/admin/login')
  }

  return (
    <aside className="w-64 flex flex-col min-h-screen shrink-0" style={{ background: '#fff', borderRight: '1px solid var(--gray-100)' }}>
      {/* Logo */}
      <div className="p-5" style={{ borderBottom: '1px solid var(--gray-100)' }}>
        <Link href="/admin" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0" style={{ boxShadow: 'var(--shadow-sm)' }}>
            <Image src="/logo.jpeg" alt="AracnidaStore" width={40} height={40} className="object-cover" />
          </div>
          <div>
            <p className="text-sm font-black" style={{ color: 'var(--text)' }}>AracnidaStore</p>
            <p className="text-xs" style={{ color: 'var(--gray-400)' }}>Panel de administración</p>
          </div>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-1">
        {NAV_ITEMS.map((item) => {
          const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all"
              style={isActive
                ? { background: 'var(--red)', color: '#fff', boxShadow: 'var(--shadow-red)' }
                : { color: 'var(--gray-600)' }}
            >
              <span style={{ color: isActive ? '#fff' : 'var(--gray-400)' }}>{item.icon}</span>
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="p-3" style={{ borderTop: '1px solid var(--gray-100)' }}>
        <Link href="/" target="_blank"
          className="flex items-center gap-2 text-xs mb-1 transition-colors px-3 py-2 rounded-lg"
          style={{ color: 'var(--gray-400)' }}>
          <ExternalLink size={13} /> Ver tienda
        </Link>
        <button onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all"
          style={{ color: 'var(--gray-600)' }}>
          <LogOut size={16} /> Cerrar sesión
        </button>
      </div>
    </aside>
  )
}
