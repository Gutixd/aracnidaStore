'use client'

import Link from 'next/link'
import { useCart } from '@/store/cart'
import { ShoppingCart, Menu, X, Search } from 'lucide-react'
import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'

export function Navbar() {
  const { getTotalItems } = useCart()
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const totalItems = getTotalItems()

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handler)
    return () => window.removeEventListener('scroll', handler)
  }, [])

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        scrolled
          ? 'bg-[#0a0a0a]/95 backdrop-blur-md border-b border-white/5 shadow-xl'
          : 'bg-transparent'
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 relative">
              <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                <circle cx="16" cy="16" r="15" stroke="#c0392b" strokeWidth="1.5" />
                <path d="M16 2 C16 2, 8 8, 8 16 C8 24, 16 30, 16 30 C16 30, 24 24, 24 16 C24 8, 16 2, 16 2Z" fill="#c0392b" opacity="0.2"/>
                <path d="M2 16 L30 16" stroke="#c0392b" strokeWidth="1" opacity="0.5"/>
                <path d="M4 8 Q16 12 28 8" stroke="#c0392b" strokeWidth="1" opacity="0.4" fill="none"/>
                <path d="M4 24 Q16 20 28 24" stroke="#c0392b" strokeWidth="1" opacity="0.4" fill="none"/>
                <circle cx="16" cy="16" r="3" fill="#c0392b"/>
              </svg>
            </div>
            <span className="text-lg font-bold tracking-tight">
              <span className="text-white">Aracnida</span>
              <span className="text-red-600">Store</span>
            </span>
          </Link>

          {/* Nav links - desktop */}
          <nav className="hidden md:flex items-center gap-8">
            <Link href="/products" className="text-sm text-white/60 hover:text-white transition-colors">
              Catálogo
            </Link>
            <Link href="/products?category=trajes" className="text-sm text-white/60 hover:text-white transition-colors">
              Trajes
            </Link>
            <Link href="/products?category=mascaras" className="text-sm text-white/60 hover:text-white transition-colors">
              Máscaras
            </Link>
            <Link href="/#faq" className="text-sm text-white/60 hover:text-white transition-colors">
              FAQ
            </Link>
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <Link
              href="/products"
              className="hidden sm:flex w-9 h-9 items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-white/60 hover:text-white"
            >
              <Search size={16} />
            </Link>
            <Link
              href="/cart"
              className="flex items-center gap-2 relative w-9 h-9 items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-white/60 hover:text-white"
            >
              <ShoppingCart size={16} />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {totalItems > 9 ? '9+' : totalItems}
                </span>
              )}
            </Link>

            {/* Mobile menu */}
            <button
              className="md:hidden w-9 h-9 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {menuOpen ? <X size={16} /> : <Menu size={16} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-[#0d1117] border-t border-white/5 px-4 py-4 space-y-3">
          <Link href="/products" className="block py-2 text-white/70 hover:text-white transition-colors" onClick={() => setMenuOpen(false)}>
            Catálogo completo
          </Link>
          <Link href="/products?category=trajes" className="block py-2 text-white/70 hover:text-white transition-colors" onClick={() => setMenuOpen(false)}>
            Trajes
          </Link>
          <Link href="/products?category=mascaras" className="block py-2 text-white/70 hover:text-white transition-colors" onClick={() => setMenuOpen(false)}>
            Máscaras
          </Link>
          <Link href="/#faq" className="block py-2 text-white/70 hover:text-white transition-colors" onClick={() => setMenuOpen(false)}>
            Preguntas frecuentes
          </Link>
        </div>
      )}
    </header>
  )
}
