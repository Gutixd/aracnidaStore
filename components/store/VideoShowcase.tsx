'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ShoppingBag } from 'lucide-react'

export function VideoShowcase() {
  const sectionRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = sectionRef.current
    if (!el) return
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            setVisible(true)
            videoRef.current?.play().catch(() => {})
          } else {
            videoRef.current?.pause()
          }
        })
      },
      { threshold: 0.25 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  return (
    <section
      ref={sectionRef}
      className="relative w-full overflow-hidden flex items-center justify-center"
      style={{ minHeight: '85vh' }}
    >
      {/* Video de fondo a pantalla completa */}
      <video
        ref={videoRef}
        src="/video-inicio.mp4"
        muted
        loop
        playsInline
        preload="metadata"
        poster="/products/disfraz-miles-morales.jpg"
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Capas oscuras para legibilidad del texto */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'linear-gradient(180deg, rgba(15,30,61,.75) 0%, rgba(15,30,61,.35) 40%, rgba(15,30,61,.55) 100%)' }}
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 60% 50% at 50% 50%, rgba(192,57,43,.18), transparent 75%)' }}
      />

      {/* Contenido encima del video */}
      <div
        className="relative z-10 text-center px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto transition-all duration-700"
        style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(30px)' }}
      >
        <div className="section-tag" style={{ color: '#f87171' }}>En acción</div>
        <h2 className="text-4xl md:text-6xl font-black text-white mb-4" style={{ textShadow: '0 4px 30px rgba(0,0,0,.6)' }}>
          Míralos en movimiento
        </h2>
        <p className="text-base md:text-xl max-w-xl mx-auto mb-10" style={{ color: 'rgba(255,255,255,.8)', textShadow: '0 2px 12px rgba(0,0,0,.5)' }}>
          Así se ven nuestros trajes y máscaras de Spider-Man en la vida real.
        </p>
        <Link href="/products" className="btn-primary text-base px-8 py-4">
          <ShoppingBag size={18} />
          Ver catálogo completo
        </Link>
      </div>
    </section>
  )
}
