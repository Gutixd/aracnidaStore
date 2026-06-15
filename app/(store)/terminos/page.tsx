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
        <p className="text-sm mb-10" style={{ color: 'var(--gray-400)' }}>Última actualización: junio 2026</p>

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
            <p>Los pedidos se procesan una vez confirmado el pago a través de Mercado Pago. Aceptamos tarjetas de crédito, débito y transferencias. AracnidaStore se reserva el derecho de cancelar un pedido en caso de error de precio o falta de stock, con reembolso total al cliente.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-3" style={{ color: 'var(--text)' }}>4. Envíos y despacho</h2>
            <p>Los pedidos se despachan dentro de 24 a 48 horas hábiles desde la confirmación del pago. Los tiempos de entrega estimados son:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Región Metropolitana: 1 a 3 días hábiles</li>
              <li>Resto de Chile: 3 a 7 días hábiles</li>
            </ul>
            <p className="mt-2">AracnidaStore no se responsabiliza por retrasos causados por la empresa de transporte o eventos de fuerza mayor.</p>
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
            <h2 className="text-lg font-bold mb-3" style={{ color: 'var(--text)' }}>6. Propiedad intelectual</h2>
            <p>Los personajes Spider-Man y sus variantes son propiedad de Marvel / Disney. AracnidaStore comercializa productos de cosplay inspirados en dichos personajes. Todas las imágenes, textos y diseños del sitio son propiedad de AracnidaStore salvo que se indique lo contrario.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-3" style={{ color: 'var(--text)' }}>7. Limitación de responsabilidad</h2>
            <p>AracnidaStore no se responsabiliza por daños indirectos derivados del uso de los productos. La responsabilidad máxima queda limitada al valor del producto adquirido.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-3" style={{ color: 'var(--text)' }}>8. Ley aplicable</h2>
            <p>Estos términos se rigen por las leyes de la República de Chile. Cualquier controversia será sometida a los tribunales competentes de Santiago de Chile.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-3" style={{ color: 'var(--text)' }}>9. Contacto</h2>
            <p>Para consultas sobre estos términos puedes contactarnos a través de nuestro Instagram o al correo de contacto indicado en el sitio.</p>
          </section>

        </div>
      </div>
    </div>
  )
}
