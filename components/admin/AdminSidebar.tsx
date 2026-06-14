'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Archive,
  DollarSign,
  BarChart2,
  Settings,
  LogOut,
  ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'

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
    <aside className="w-64 bg-[#0d1117] border-r border-white/5 flex flex-col min-h-screen">
      {/* Logo */}
      <div className="p-6 border-b border-white/5">
        <Link href="/admin" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-red-900/20 rounded-lg flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4">
              <circle cx="12" cy="12" r="11" stroke="#c0392b" strokeWidth="1.5"/>
              <circle cx="12" cy="12" r="2.5" fill="#c0392b"/>
              <path d="M2 12 L22 12" stroke="#c0392b" strokeWidth="1" opacity="0.5"/>
              <path d="M3 7 Q12 10 21 7" stroke="#c0392b" strokeWidth="1" opacity="0.4" fill="none"/>
            </svg>
          </div>
          <div>
            <p className="text-sm font-bold text-white">AracnidaStore</p>
            <p className="text-xs text-white/30">Panel Admin</p>
          </div>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1">
        {NAV_ITEMS.map((item) => {
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href)

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group',
                isActive
                  ? 'bg-red-900/20 text-red-400 border border-red-800/20'
                  : 'text-white/50 hover:text-white/80 hover:bg-white/5'
              )}
            >
              <span className={isActive ? 'text-red-400' : 'text-white/30 group-hover:text-white/60'}>
                {item.icon}
              </span>
              {item.label}
              {isActive && <ChevronRight size={12} className="ml-auto text-red-600" />}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-white/5">
        <Link
          href="/"
          target="_blank"
          className="flex items-center gap-2 text-xs text-white/30 hover:text-white/60 mb-3 transition-colors px-3 py-2"
        >
          <span>↗</span> Ver tienda
        </Link>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-white/30 hover:text-red-400 hover:bg-red-900/10 transition-all"
        >
          <LogOut size={16} />
          Cerrar sesión
        </button>
      </div>
    </aside>
  )
}
