import { FREE_SHIPPING_THRESHOLD, MIN_SHIPPING_COST } from '@/lib/shipping'
import { PICKUP_PLACE } from '@/lib/pickup'
import { RESERVATION_MIN_DAYS } from '@/lib/reservations'
import { formatPrice } from '@/lib/utils'

/**
 * Barra roja en loop arriba de todo. Cada mensaje es una condición REAL de
 * la tienda, leída de las mismas constantes que usa el checkout — si mañana
 * cambia el umbral de envío gratis o el descuento de reserva, este texto
 * cambia solo y no queda prometiendo algo que ya no se cumple.
 *
 * A propósito NO dice "hasta 70% de descuento" ni "envío gratis a todo el
 * mundo": lo primero no existe y lo segundo es falso (se despacha solo
 * dentro de Chile). Una promesa que no se cumple en el checkout cuesta más
 * cara que el clic que gana.
 */
const MESSAGES = [
  `ENVÍO GRATIS EN COMPRAS SOBRE ${formatPrice(FREE_SHIPPING_THRESHOLD)} EN LA ZONA CENTRO`,
  `RETIRO GRATIS EN ${PICKUP_PLACE.toUpperCase()}`,
  `15% DE DESCUENTO RESERVANDO CON ${RESERVATION_MIN_DAYS} DÍAS DE ANTICIPACIÓN`,
  `ENVÍOS A TODO CHILE DESDE ${formatPrice(MIN_SHIPPING_COST)}`,
  'CAMBIOS DENTRO DE 7 DÍAS',
]

export function AnnouncementBar() {
  // La lista se duplica para que el loop no muestre un vacío al reiniciar:
  // la animación desplaza exactamente la mitad del ancho total.
  const track = [...MESSAGES, ...MESSAGES]

  return (
    <div
      // Fija y por encima del Navbar (z-50), que se corre 36px hacia abajo.
      className="fixed top-0 left-0 right-0 z-[60] overflow-hidden"
      style={{ background: 'var(--red)', height: 36 }}
      aria-label="Anuncios de la tienda"
    >
      <div className="marquee flex items-center gap-8 whitespace-nowrap h-full">
        {track.map((msg, i) => (
          <span
            key={i}
            className="text-[11px] sm:text-xs font-bold tracking-wider inline-flex items-center gap-8"
            style={{ color: '#fff' }}
            // La segunda mitad es puramente decorativa (repetición visual):
            // se oculta a los lectores de pantalla para no leerlo dos veces.
            aria-hidden={i >= MESSAGES.length}
          >
            {msg}
            <span style={{ color: 'rgba(255,255,255,.45)' }}>✦</span>
          </span>
        ))}
      </div>
    </div>
  )
}
