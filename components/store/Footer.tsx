import Link from 'next/link'
import { Mail, MapPin } from 'lucide-react'

export function Footer() {
  return (
    <footer className="bg-[#0d1117] border-t border-white/5 mt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <svg viewBox="0 0 32 32" fill="none" className="w-8 h-8">
                <circle cx="16" cy="16" r="15" stroke="#c0392b" strokeWidth="1.5"/>
                <circle cx="16" cy="16" r="3" fill="#c0392b"/>
                <path d="M2 16 L30 16" stroke="#c0392b" strokeWidth="1" opacity="0.5"/>
                <path d="M4 8 Q16 12 28 8" stroke="#c0392b" strokeWidth="1" opacity="0.4" fill="none"/>
                <path d="M4 24 Q16 20 28 24" stroke="#c0392b" strokeWidth="1" opacity="0.4" fill="none"/>
              </svg>
              <span className="text-lg font-bold">
                <span className="text-white">Aracnida</span>
                <span className="text-red-600">Store</span>
              </span>
            </div>
            <p className="text-sm text-white/40 max-w-xs leading-relaxed">
              Trajes y máscaras de araña de calidad premium. Diseños de alta fidelidad,
              materiales de primera. Envíos a todo Chile.
            </p>
            <div className="flex items-center gap-3 mt-6">
              <a
                href="#"
                className="w-9 h-9 bg-white/5 hover:bg-red-700/20 rounded-lg flex items-center justify-center text-white/40 hover:text-red-400 transition-all"
                aria-label="Instagram"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </a>
              <a
                href="mailto:contacto@aracnidastore.cl"
                className="w-9 h-9 bg-white/5 hover:bg-red-700/20 rounded-lg flex items-center justify-center text-white/40 hover:text-red-400 transition-all"
              >
                <Mail size={16} />
              </a>
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-4">Tienda</h4>
            <ul className="space-y-2.5">
              {[
                { href: '/products', label: 'Catálogo' },
                { href: '/products?category=trajes', label: 'Trajes' },
                { href: '/products?category=mascaras', label: 'Máscaras' },
                { href: '/cart', label: 'Carrito' },
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-white/40 hover:text-white/80 transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Info */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-4">Información</h4>
            <ul className="space-y-2.5">
              {[
                { href: '/#faq', label: 'Preguntas frecuentes' },
                { href: '/#faq', label: 'Envíos y despacho' },
                { href: '/#faq', label: 'Cambios y devoluciones' },
              ].map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-sm text-white/40 hover:text-white/80 transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
              <li className="flex items-start gap-2 pt-2">
                <MapPin size={14} className="text-white/30 mt-0.5 shrink-0" />
                <span className="text-sm text-white/30">Chile</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-white/20">
            © {new Date().getFullYear()} AracnidaStore. Todos los derechos reservados.
          </p>
          <p className="text-xs text-white/20">Hecho en Chile</p>
        </div>
      </div>
    </footer>
  )
}
