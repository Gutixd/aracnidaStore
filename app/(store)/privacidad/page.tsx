import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Política de Privacidad — AracnidaStore',
  description: 'Política de privacidad y tratamiento de datos personales de AracnidaStore.',
  alternates: { canonical: '/privacidad' },
}

export default function PrivacidadPage() {
  return (
    <div style={{ background: 'var(--gray-50)', minHeight: '100vh' }}>
      <div className="max-w-3xl mx-auto pt-28 pb-20 px-4 sm:px-6">
        <Link href="/" className="text-sm font-medium hover:opacity-70 mb-8 inline-block" style={{ color: 'var(--red)' }}>
          ← Volver al inicio
        </Link>

        <h1 className="text-3xl font-black mb-2" style={{ color: 'var(--text)' }}>Política de Privacidad</h1>
        <p className="text-sm mb-10" style={{ color: 'var(--gray-400)' }}>Última actualización: julio 2026</p>

        <div className="card p-8 space-y-8" style={{ color: 'var(--gray-600)', lineHeight: '1.8' }}>

          <section>
            <h2 className="text-lg font-bold mb-3" style={{ color: 'var(--text)' }}>1. Responsable del tratamiento</h2>
            <p>AracnidaStore es el responsable del tratamiento de los datos personales recopilados a través de este sitio web, en cumplimiento con la Ley N° 19.628 sobre Protección de la Vida Privada de Chile.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-3" style={{ color: 'var(--text)' }}>2. Datos que recopilamos</h2>
            <p>Al realizar una compra recopilamos:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Nombre completo</li>
              <li>Correo electrónico</li>
              <li>Número de teléfono</li>
              <li>Dirección de entrega (calle, región, comuna), si eliges despacho a domicilio</li>
              <li>Historial de pedidos</li>
            </ul>
            <p className="mt-2">Los datos de pago con tarjeta son procesados directamente por Mercado Pago y no son almacenados en nuestros servidores. Si pagas en efectivo o por transferencia al retirar tu pedido, no se recopila ningún dato bancario adicional.</p>
            <p className="mt-2">Si dejas una reseña de un producto, se publica de forma pública tu nombre y el comentario que escribas, luego de ser revisado por el equipo. Puedes solicitar su eliminación en cualquier momento (ver sección 6).</p>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-3" style={{ color: 'var(--text)' }}>3. Finalidad del tratamiento</h2>
            <p>Utilizamos tus datos exclusivamente para:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Procesar y gestionar tus pedidos</li>
              <li>Coordinar el envío a domicilio</li>
              <li>Enviarte confirmaciones de compra</li>
              <li>Atender consultas y solicitudes de cambio</li>
            </ul>
            <p className="mt-2">No utilizamos tus datos para envío de publicidad sin tu consentimiento.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-3" style={{ color: 'var(--text)' }}>4. Almacenamiento y seguridad</h2>
            <p>Los datos se almacenan en servidores seguros de Supabase (ubicados en Estados Unidos) con encriptación en tránsito y en reposo, y acceso restringido solo a personal autorizado de AracnidaStore. Al comprar en nuestro sitio, aceptas esta transferencia internacional de datos, protegida con las medidas de seguridad indicadas en esta política.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-3" style={{ color: 'var(--text)' }}>5. Compartición de datos</h2>
            <p>No vendemos ni cedemos tus datos personales a terceros. Solo los compartimos con quienes son estrictamente necesarios para procesar y entregar tu pedido:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li><strong>Mercado Pago:</strong> para procesar pagos con tarjeta de forma segura</li>
              <li><strong>Blue Express:</strong> nombre, dirección y teléfono para gestionar el despacho, cuando eliges envío a domicilio</li>
              <li><strong>Resend:</strong> tu correo electrónico, para enviarte el comprobante de compra</li>
              <li><strong>Telegram:</strong> herramienta interna que usamos para recibir avisos de nuevos pedidos; no es visible a terceros ajenos al equipo</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-3" style={{ color: 'var(--text)' }}>6. Tus derechos</h2>
            <p>Tienes derecho a:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Acceder a tus datos personales</li>
              <li>Solicitar la rectificación de datos inexactos</li>
              <li>Solicitar la eliminación de tus datos</li>
              <li>Oponerte al tratamiento de tus datos</li>
              <li>Solicitar la eliminación de una reseña publicada con tu nombre</li>
            </ul>
            <p className="mt-2">Para ejercer estos derechos, contáctanos por Instagram, WhatsApp o correo electrónico. Responderemos dentro de un plazo razonable.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-3" style={{ color: 'var(--text)' }}>7. Cookies y almacenamiento local</h2>
            <p>Este sitio <strong>no utiliza cookies de seguimiento ni de publicidad</strong>, ni comparte datos de navegación con redes sociales u otras plataformas de análisis. No verás un aviso de cookies porque no lo necesitamos: no rastreamos tu navegación.</p>
            <p className="mt-2">Usamos únicamente almacenamiento técnico en tu propio navegador, que nunca sale de tu dispositivo:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li><strong>Carrito de compras:</strong> guardado en tu navegador (localStorage) para que no pierdas tus productos al cambiar de página</li>
              <li><strong>Animación de bienvenida:</strong> un indicador temporal (sessionStorage) para no repetirla cada vez que cambias de página en la misma visita</li>
            </ul>
            <p className="mt-2">Si eres administrador de la tienda e inicias sesión en el panel, se usa una cookie de autenticación estrictamente necesaria para mantener tu sesión iniciada. No aplica a clientes.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-3" style={{ color: 'var(--text)' }}>8. Modificaciones</h2>
            <p>Nos reservamos el derecho de actualizar esta política. Los cambios importantes serán publicados en esta página con la fecha de actualización correspondiente.</p>
          </section>

        </div>
      </div>
    </div>
  )
}
