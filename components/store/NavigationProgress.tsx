'use client'

import { createContext, useContext, useEffect, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

/**
 * Da feedback visual instantáneo en CUALQUIER navegación entre secciones
 * principales (Catálogo, Disfraces, Máscaras, Peluches...), sin depender de
 * loading.tsx — que no alcanza a activarse en este sitio porque esas
 * "páginas" son en realidad la misma ruta /products con un ?category=
 * distinto, y React mantiene el contenido anterior visible durante esa
 * transición en vez de mostrar un fallback (comportamiento a propósito de
 * los Suspense dentro de una transición, para no parpadear en casos donde
 * sí conviene mantener lo visible — pero acá el usuario SÍ quiere ver que
 * algo está pasando).
 *
 * En vez de pelear contra eso, se hace explícito: mientras la navegación
 * está pendiente, se atenúa/difumina levemente el contenido actual y se
 * desliza una barra fina arriba (el patrón "nprogress" de sitios premium).
 * Apenas el contenido nuevo llega, se desvanece la barra y el contenido
 * reaparece nítido con su propio fade-in (ver animate-fade-in en las
 * páginas). Nada de esto cambia si loading.tsx sigue existiendo para el
 * caso real que sí cubre: entrar a /products por primera vez desde otra
 * ruta.
 */

interface NavCtx {
  isPending: boolean
  navigate: (href: string) => void
  /** Para navegaciones con reglas propias (ej. los filtros del catálogo,
   *  que usan router.replace + scroll:false para no ensuciar el historial
   *  ni saltar el scroll en cada clic) — misma barra de progreso y mismo
   *  difuminado, sin forzar el push/scroll por defecto de `navigate`. */
  withTransition: (fn: () => void) => void
}

const NavigationContext = createContext<NavCtx | null>(null)

export function useNavigationProgress() {
  const ctx = useContext(NavigationContext)
  if (!ctx) throw new Error('useNavigationProgress debe usarse dentro de <NavigationProgressProvider>')
  return ctx
}

/**
 * Solo el contexto + la barra de progreso (que es fija y global, no importa
 * qué envuelva). El difuminado del CONTENIDO va aparte, en
 * <PageTransitionOverlay>, porque este provider tiene que envolver también
 * al Navbar (sus links usan este contexto) y el Navbar no debe difuminarse
 * ni volverse inerte mientras la página de destino carga.
 */
export function NavigationProgressProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function navigate(href: string) {
    startTransition(() => {
      router.push(href)
    })
  }

  return (
    <NavigationContext.Provider value={{ isPending, navigate, withTransition: startTransition }}>
      <ProgressBar active={isPending} />
      {children}
    </NavigationContext.Provider>
  )
}

/** Difumina/atenúa específicamente el contenido de la página mientras hay
 *  una navegación pendiente. Se usa envolviendo `{children}` dentro de
 *  `<main>`, nunca envolviendo el Navbar. */
export function PageTransitionOverlay({ children }: { children: React.ReactNode }) {
  const { isPending } = useNavigationProgress()
  return (
    <div
      className="transition-[opacity,filter] duration-300 ease-out"
      style={isPending ? { opacity: 0.5, filter: 'blur(2px)' } : { opacity: 1, filter: 'none' }}
    >
      {children}
    </div>
  )
}

/** Barra fina arriba de la pantalla, estilo "nprogress" — avanza mientras
 *  espera y no se sabe cuánto falta, remata al 100% y se desvanece al llegar. */
function ProgressBar({ active }: { active: boolean }) {
  const [width, setWidth] = useState(0)
  const [visible, setVisible] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (active) {
      setVisible(true)
      setWidth(15)
      // Avanza rápido al principio y cada vez más lento, sin llegar nunca
      // al 100% por sí sola — eso solo pasa cuando de verdad termina.
      timerRef.current = setInterval(() => {
        setWidth((w) => (w < 80 ? w + (80 - w) * 0.15 : w))
      }, 200)
    } else if (visible) {
      if (timerRef.current) clearInterval(timerRef.current)
      setWidth(100)
      const hide = setTimeout(() => {
        setVisible(false)
        setWidth(0)
      }, 250)
      return () => clearTimeout(hide)
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [active, visible])

  if (!visible) return null

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] h-[3px] pointer-events-none">
      <div
        className="h-full transition-all ease-out"
        style={{
          width: `${width}%`,
          background: 'linear-gradient(90deg, #c0392b, #e74c3c)',
          boxShadow: '0 0 8px rgba(192,57,43,.6)',
          transitionDuration: width === 100 ? '200ms' : '400ms',
        }}
      />
    </div>
  )
}
