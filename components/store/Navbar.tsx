'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useCart } from '@/store/cart'
import { ShoppingCart, Menu, X } from 'lucide-react'
import { useState, useEffect } from 'react'

export function Navbar() {
  const { getTotalItems } = useCart()
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const totalItems = getTotalItems()

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', handler)
    return () => window.removeEventListener('scroll', handler)
  }, [])

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-400"
      style={scrolled ? {
        background: 'rgba(255,255,255,0.95)',
        backdropFilter: 'blur(20px)',
        boxShadow: '0 2px 20px rgba(0,0,0,.08)',
        borderBottom: '1px solid rgba(0,0,0,.06)',
      } : {
        background: 'transparent',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl overflow-hidden transition-transform group-hover:scale-110"
              style={{ background: '#fff', boxShadow: scrolled ? 'var(--shadow-sm)' : '0 2px 12px rgba(0,0,0,.25)' }}>
              <Image src="/logo.jpeg" alt="AracnidaStore" width={40} height={40} className="object-cover" priority />
            </div>
            <span className="text-lg font-black tracking-tight" style={{ color: scrolled ? '#1a1a18' : '#fff' }}>
              Aracnida<span style={{ color: '#c0392b' }}>Store</span>
            </span>
          </Link>

          {/* Nav links desktop */}
          <nav className="hidden md:flex items-center gap-1">
            {[
              { href: '/products', label: 'Catálogo' },
              { href: '/products?category=disfraces', label: 'Disfraces' },
              { href: '/products?category=mascaras', label: 'Máscaras' },
              { href: '/products?category=peluches', label: 'Peluches' },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
                style={{ color: scrolled ? '#5a5a54' : 'rgba(255,255,255,.75)' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = scrolled ? '#f7f7f5' : 'rgba(255,255,255,.1)'
                  e.currentTarget.style.color = scrolled ? '#1a1a18' : '#fff'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.color = scrolled ? '#5a5a54' : 'rgba(255,255,255,.75)'
                }}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Link
              href="/cart"
              className="relative flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm transition-all"
              style={{ background: '#c0392b', color: '#fff' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#e74c3c'; e.currentTarget.style.transform = 'translateY(-1px)' }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#c0392b'; e.currentTarget.style.transform = 'none' }}
            >
              <ShoppingCart size={15} />
              <span className="hidden sm:inline">Carrito</span>
              {totalItems > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-white text-red-600 text-xs font-black rounded-full flex items-center justify-center shadow">
                  {totalItems > 9 ? '9+' : totalItems}
                </span>
              )}
            </Link>

            <button
              className="md:hidden w-9 h-9 flex items-center justify-center rounded-lg transition-all"
              style={{ background: scrolled ? '#f7f7f5' : 'rgba(255,255,255,.1)', color: scrolled ? '#1a1a18' : '#fff' }}
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {menuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden px-4 py-4 space-y-1 animate-fade-in"
          style={{ background: '#fff', borderTop: '1px solid #efefec', boxShadow: '0 8px 24px rgba(0,0,0,.1)' }}>
          {[
            { href: '/products', label: 'Todo el catálogo' },
            { href: '/products?category=disfraces', label: 'Disfraces' },
            { href: '/products?category=mascaras', label: 'Máscaras' },
            { href: '/products?category=peluches', label: 'Peluches' },
          ].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="block px-4 py-3 rounded-xl text-sm font-medium transition-all"
              style={{ color: '#5a5a54' }}
              onClick={() => setMenuOpen(false)}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#f7f7f5'; e.currentTarget.style.color = '#1a1a18' }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#5a5a54' }}
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </header>
  )
}
