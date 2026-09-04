import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Términos y Condiciones — AracnidaStore',
  description: 'Términos y condiciones de uso de AracnidaStore, tienda de disfraces y máscaras Spider-Man en Chile.',
  alternates: { canonical: '/terminos' },
}

export default function TerminosPage() {
  return (
    <div style={{ background: 'var(--gray-50)', minHeight: '100vh' }}>
      <div className="max-w-3xl mx-auto pt-28 pb-20 px-4 sm:px-6">
        <Link href="/" className="text-sm font-medium hover:opacity-70 mb-8 inline-block" style={{ color: 'var(--red)' }}>
          ← Volver al inicio
        </Link>

        <h1 className="text-3xl font-black mb-2" style={{ color: 'var(--text)' }}>Términos y Condiciones</h1>
        <p className="text-sm mb-10" style={{ color: 'var(--gray-400)' }}>Última actualización: julio 2026</p>

        <div className="card p-8 space-y-8 prose-sm" style={{ color: 'var(--gray-600)', lineHeight: '1.8' }}>

          <section>
            <h2 className="text-lg font-bold mb-3" style={{ color: 'var(--text)' }}>1. Aceptación de términos</h2>
            <p>Al acceder y realizar una compra en AracnidaStore, aceptas estos Términos y Condiciones. Si no estás de acuerdo con alguna de estas condiciones, te pedimos que no realices compras en nuestro sitio.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-3" style={{ color: 'var(--text)' }}>2. Productos y precios</h2>
            <p>Los precios publicados en el sitio están expresados en pesos chilenos (CLP) e incluyen IVA. AracnidaStore se reserva el derecho de modificar los precios sin previo aviso. Las imágenes son referenciales y los colores pueden variar levemente según el dispositivo.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-3" style={{ color: 'var(--text)' }}>3. Proceso de compra y pago</h2>
            <p>Ofrecemos dos formas de comprar:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li><strong>Envío a domicilio:</strong> el pedido se procesa una vez confirmado el pago a través de Mercado Pago (tarjetas de crédito, débito o transferencia dentro de esa plataforma).</li>
              <li><strong>Retiro en Plaza de Maipú:</strong> se paga en efectivo o por transferencia bancaria directa al momento del retiro, coordinando con al menos 24 horas de anticipación.</li>
            </ul>
            <p className="mt-2">Los pedidos con pago en línea que no se completen dentro de un plazo razonable (actualmente 45 minutos) se cancelan automáticamente y el stock reservado se libera para otros clientes. Si tu pago fue aprobado pero tu pedido ya expiró, contáctanos para regularizarlo.</p>
            <p className="mt-2">AracnidaStore se reserva el derecho de cancelar un pedido en caso de error de precio o falta de stock, con reembolso total al cliente.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-3" style={{ color: 'var(--text)' }}>4. Envíos y retiro en persona</h2>
            <p><strong>Envío a domicilio</strong> por Blue Express: los pedidos se despachan dentro de 24 a 48 horas hábiles desde la confirmación del pago. Tiempos de entrega estimados:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Región Metropolitana: 1 a 3 días hábiles</li>
              <li>Zona centro y sur (Valparaíso a La Araucanía): 3 a 7 días hábiles</li>
              <li>Zonas extremas (Arica, Tarapacá, Antofagasta, Atacama, Los Ríos, Los Lagos, Aysén y Magallanes): 7 a 12 días hábiles</li>
            </ul>
            <p className="mt-2">El costo de envío varía según tu región y se muestra antes de pagar. AracnidaStore no se responsabiliza por retrasos causados por la empresa de transporte o eventos de fuerza mayor.</p>
            <p className="mt-2"><strong>Retiro gratuito en Metro Plaza de Maipú:</strong> disponible los días martes (13:00 a 16:00) y sábado (11:00 a 15:00), coordinando con al menos 24 horas de anticipación. Debes confirmar tu retiro por WhatsApp o Instagram.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-3" style={{ color: 'var(--text)' }}>5. Cambios y devoluciones</h2>
            <p>Aceptamos cambios dentro de 7 días corridos desde la recepción del producto, siempre que:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>El producto esté sin usar, con etiquetas y en su embalaje original</li>
              <li>El cliente cubra el costo del envío de devolución</li>
              <li>Se presente el número de orden</li>
            </ul>
            <p className="mt-2">No se aceptan devoluciones de productos usados o en mal estado por mal uso.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-3" style={{ color: 'var(--text)' }}>6. Reseñas de clientes</h2>
            <p>Puedes dejar una reseña de un producto que hayas comprado. Al enviarla, autorizas a AracnidaStore a publicar tu nombre y comentario en el sitio. Toda reseña es revisada antes de publicarse y AracnidaStore se reserva el derecho de rechazar o eliminar contenido falso, ofensivo, o que no corresponda a una compra real. Puedes solicitar la eliminación de tu reseña en cualquier momento.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-3" style={{ color: 'var(--text)' }}>7. Propiedad intelectual</h2>
            <p>Los personajes Spider-Man y sus variantes son propiedad de Marvel / Disney. AracnidaStore comercializa productos de cosplay inspirados en dichos personajes. Todas las imágenes, textos y diseños del sitio son propiedad de AracnidaStore salvo que se indique lo contrario.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-3" style={{ color: 'var(--text)' }}>8. Limitación de responsabilidad</h2>
            <p>AracnidaStore no se responsabiliza por daños indirectos derivados del uso de los productos. La responsabilidad máxima queda limitada al valor del producto adquirido.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-3" style={{ color: 'var(--text)' }}>9. Ley aplicable</h2>
            <p>Estos términos se rigen por las leyes de la República de Chile. Cualquier controversia será sometida a los tribunales competentes de Santiago de Chile.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-3" style={{ color: 'var(--text)' }}>10. Contacto</h2>
            <p>Para consultas sobre estos términos puedes contactarnos a través de nuestro Instagram o al correo de contacto indicado en el sitio.</p>
          </section>

        </div>
      </div>
    </div>
  )
}
