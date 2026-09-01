'use client'

import Link from 'next/link'
import { useNavigationProgress } from './NavigationProgress'

interface NavLinkProps extends React.ComponentProps<typeof Link> {
  href: string
}

/**
 * Igual que <Link>, pero además dispara la barra de progreso y el
 * difuminado de NavigationProgress en el clic normal. Sigue siendo un
 * <Link> de verdad por debajo (mismo prefetch, mismo href real para SEO),
 * así que Ctrl/Cmd+clic, clic derecho → abrir en pestaña nueva, y clic con
 * la rueda siguen funcionando exactamente igual que antes — solo se
 * intercepta el clic izquierdo simple, que es el 99% de los casos.
 */
export function NavLink({ href, onClick, ...props }: NavLinkProps) {
  const { navigate } = useNavigationProgress()

  return (
    <Link
      href={href}
      onClick={(e) => {
        onClick?.(e)
        const isModifiedClick =
          e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0
        if (!isModifiedClick && !e.defaultPrevented) {
          e.preventDefault()
          navigate(href)
        }
      }}
      {...props}
    />
  )
}
