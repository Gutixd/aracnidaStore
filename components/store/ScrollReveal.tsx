'use client'

import { useLayoutEffect, useRef } from 'react'

interface ScrollRevealProps {
  children: React.ReactNode
  delay?: number
  className?: string
}

/**
 * Fundido sutil al entrar en pantalla, SIN esconder nada que ya se ve.
 *
 * El contenido llega visible desde el servidor. Antes de que el navegador
 * pinte (useLayoutEffect), solo lo que quedó bajo el pliegue se oculta para
 * animarlo al hacer scroll. Lo que está en pantalla al cargar se queda
 * quieto: nunca hay una pantalla en blanco esperando al JavaScript.
 */
export function ScrollReveal({ children, delay = 0, className = '' }: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    if (el.getBoundingClientRect().top < window.innerHeight * 0.9) return

    el.classList.add('reveal-pending')
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        // El retraso escalonado se limita: esperar más de 150 ms se siente lento.
        setTimeout(() => el.classList.remove('reveal-pending'), Math.min(delay, 150))
        observer.disconnect()
      },
      { threshold: 0.08 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [delay])

  return (
    <div ref={ref} className={`reveal ${className}`}>
      {children}
    </div>
  )
}
