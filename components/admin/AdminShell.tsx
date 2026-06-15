'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  LayoutDashboard, Package, ShoppingCart, Archive,
  DollarSign, BarChart2, Settings, LogOut, ExternalLink,
  Menu, X,
} from 'lucide-react'

interface NavItem {
  href: string
  label: string
  icon: React.ReactNode
  exact?: boolean
  badgeKey?: 'pending' | 'lowStock'
}

const NAV_ITEMS: NavItem[] = [
  { href: '/admin', label: 'Dashboard', icon: <LayoutDashboard size={18} />, exact: true },
  { href: '/admin/orders', label: 'Pedidos', icon: <ShoppingCart size={18} />, badgeKey: 'pending' },
  { href: '/admin/products', label: 'Productos', icon: <Package size={18} /> },
  { href: '/admin/inventory', label: 'Inventario', icon: <Archive size={18} />, badgeKey: 'lowStock' },
  { href: '/admin/expenses', label: 'Gastos', icon: <DollarSign size={18} /> },
  { href: '/admin/analytics', label: 'Analytics', icon: <BarChart2 size={18} /> },
  { href: '/admin/settings', label: 'Configuración', icon: <Settings size={18} /> },
]

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [badges, setBadges] = useState<{ pending: number; lowStock: number }>({ pending: 0, lowStock: 0 })

  // Cerrar el drawer al navegar
  useEffect(() => { setOpen(false) }, [pathname])

  // Contadores en vivo para la navegación
  useEffect(() => {
    let active = true
    async function load() {
      const supabase = createClient()
      const [{ count: pending }, { data: products }] = await Promise.all([
        supabase.from('orders').select('id', { count: 'exact', head: true }).eq('status', 'pendiente'),
        supabase.from('products').select('stock').eq('active', true).lte('stock', 3),
      ])
      if (active) setBadges({ pending: pending ?? 0, lowStock: products?.length ?? 0 })
    }
    load()
  }, [pathname])

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/admin/login')
  }

  const NavLinks = () => (
    <nav className="flex-1 p-3 space-y-1">
      {NAV_ITEMS.map((item) => {
        const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href)
        const badge = item.badgeKey ? badges[item.badgeKey] : 0
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
            <span className="flex-1">{item.label}</span>
            {badge > 0 && (
              <span
                className="inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full text-xs font-bold tabular-nums"
                style={isActive
                  ? { background: 'rgba(255,255,255,.25)', color: '#fff' }
                  : { background: 'var(--red)', color: '#fff' }}
              >
                {badge}
              </span>
            )}
          </Link>
        )
      })}
    </nav>
  )

  const Branding = () => (
    <Link href="/admin" className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0" style={{ boxShadow: 'var(--shadow-sm)' }}>
        <Image src="/logo.jpeg" alt="AracnidaStore" width={40} height={40} className="object-cover" />
      </div>
      <div>
        <p className="text-sm font-black" style={{ color: 'var(--text)' }}>AracnidaStore</p>
        <p className="text-xs" style={{ color: 'var(--gray-400)' }}>Panel de administración</p>
      </div>
    </Link>
  )

  const SidebarFooter = () => (
    <div className="p-3" style={{ borderTop: '1px solid var(--gray-100)' }}>
      <Link href="/" target="_blank"
        className="flex items-center gap-2 text-xs mb-1 transition-colors px-3 py-2 rounded-lg"
        style={{ color: 'var(--gray-400)' }}>
        <ExternalLink size={13} /> Ver tienda
      </Link>
      <button onClick={handleLogout}
        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-80"
        style={{ color: 'var(--gray-600)' }}>
        <LogOut size={16} /> Cerrar sesión
      </button>
    </div>
  )

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--gray-50)' }}>
      {/* Sidebar — escritorio */}
      <aside className="hidden lg:flex w-64 flex-col min-h-screen shrink-0 sticky top-0 h-screen"
        style={{ background: '#fff', borderRight: '1px solid var(--gray-100)' }}>
        <div className="p-5" style={{ borderBottom: '1px solid var(--gray-100)' }}><Branding /></div>
        <NavLinks />
        <SidebarFooter />
      </aside>

      {/* Drawer — móvil */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,.4)' }} onClick={() => setOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-72 flex flex-col"
            style={{ background: '#fff', boxShadow: '0 0 40px rgba(0,0,0,.2)' }}>
            <div className="p-5 flex items-center justify-between" style={{ borderBottom: '1px solid var(--gray-100)' }}>
              <Branding />
              <button onClick={() => setOpen(false)} style={{ color: 'var(--gray-400)' }} aria-label="Cerrar menú">
                <X size={20} />
              </button>
            </div>
            <NavLinks />
            <SidebarFooter />
          </aside>
        </div>
      )}

      {/* Contenido */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar — móvil */}
        <header className="lg:hidden sticky top-0 z-40 flex items-center justify-between px-4 h-14"
          style={{ background: '#fff', borderBottom: '1px solid var(--gray-100)' }}>
          <button onClick={() => setOpen(true)} className="p-1.5 -ml-1.5" style={{ color: 'var(--text)' }} aria-label="Abrir menú">
            <Menu size={22} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg overflow-hidden">
              <Image src="/logo.jpeg" alt="" width={28} height={28} className="object-cover" />
            </div>
            <span className="text-sm font-black" style={{ color: 'var(--text)' }}>AracnidaStore</span>
          </div>
          {badges.pending > 0 ? (
            <Link href="/admin/orders" className="inline-flex items-center justify-center min-w-6 h-6 px-1.5 rounded-full text-xs font-bold"
              style={{ background: 'var(--red)', color: '#fff' }}>
              {badges.pending}
            </Link>
          ) : <span className="w-6" />}
        </header>

        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  )
}
