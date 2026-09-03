'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useCart } from '@/store/cart'
import { ShoppingCart, Menu, X, Search, Shirt, Drama, Sparkles, PawPrint, ChevronRight } from 'lucide-react'
import { useState, useEffect } from 'react'
import { NavLink } from './NavLink'

const MOBILE_LINKS = [
  { href: '/products', label: 'Todo el catálogo', icon: Sparkles },
  { href: '/products?category=disfraces', label: 'Disfraces', icon: Shirt },
  { href: '/products?category=mascaras', label: 'Máscaras', icon: Drama },
  { href: '/products?category=peluches', label: 'Peluches', icon: PawPrint },
]

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
      // top-9 (36px) = alto de la AnnouncementBar, que va fija encima.
      className="fixed top-9 left-0 right-0 z-50 transition-all duration-400"
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
              <NavLink
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
              </NavLink>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Link
              href="/rastrear-pedido"
              className="hidden md:flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition-all"
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
              <Search size={14} /> Mi pedido
            </Link>
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
        <>
          {/* Fondo oscuro detrás del panel, para cerrar tocando afuera */}
          <div
            className="md:hidden fixed inset-0 -z-10 animate-fade-in"
            style={{ top: '64px', background: 'rgba(15,10,10,.4)', backdropFilter: 'blur(2px)' }}
            onClick={() => setMenuOpen(false)}
          />

          <div className="md:hidden animate-fade-up"
            style={{ background: '#fff', borderTop: '1px solid #efefec', boxShadow: '0 16px 40px rgba(0,0,0,.18)', borderRadius: '0 0 24px 24px', overflow: 'hidden' }}>

            <nav className="px-3 pt-3 pb-2 grid grid-cols-1 gap-1.5">
              {MOBILE_LINKS.map(({ href, label, icon: Icon }) => (
                <NavLink
                  key={href}
                  href={href}
                  className="flex items-center gap-3 px-3 py-3.5 rounded-2xl text-[15px] font-semibold transition-all active:scale-[0.98]"
                  style={{ color: '#1a1a18' }}
                  onClick={() => setMenuOpen(false)}
                  onTouchStart={(e) => { e.currentTarget.style.background = '#f7f7f5' }}
                  onTouchEnd={(e) => { e.currentTarget.style.background = 'transparent' }}
                >
                  <span className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: 'rgba(192,57,43,.08)', color: '#c0392b' }}>
                    <Icon size={17} />
                  </span>
                  {label}
                  <ChevronRight size={16} className="ml-auto" style={{ color: '#d4d3cf' }} />
                </NavLink>
              ))}
            </nav>

            <div className="mx-3 my-1" style={{ borderTop: '1px solid #f0f0ee' }} />

            <div className="px-3 pt-2 pb-4">
              <Link
                href="/rastrear-pedido"
                className="flex items-center gap-3 px-3 py-3 rounded-2xl text-sm font-medium transition-all active:scale-[0.98]"
                style={{ color: '#5a5a54' }}
                onClick={() => setMenuOpen(false)}
                onTouchStart={(e) => { e.currentTarget.style.background = '#f7f7f5' }}
                onTouchEnd={(e) => { e.currentTarget.style.background = 'transparent' }}
              >
                <Search size={16} style={{ color: '#9b9b93' }} />
                Rastrear mi pedido
              </Link>

              <a
                href="https://wa.me/56978829942"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 flex items-center justify-center gap-2 px-4 py-3.5 rounded-2xl text-sm font-bold text-white transition-all active:scale-[0.98]"
                style={{ background: 'linear-gradient(135deg, #25d366, #1fb959)' }}
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                Escríbenos por WhatsApp
              </a>
            </div>
          </div>
        </>
      )}
    </header>
  )
}
