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
        <p className="text-sm mb-10" style={{ color: 'var(--gray-400)' }}>Última actualización: junio 2026</p>

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
              <li>Dirección de entrega (calle, región, comuna)</li>
              <li>Historial de pedidos</li>
            </ul>
            <p className="mt-2">Los datos de pago son procesados directamente por Mercado Pago y no son almacenados en nuestros servidores.</p>
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
            <p>Los datos se almacenan en servidores seguros de Supabase (ubicados en la Unión Europea) con encriptación en tránsito y en reposo. Implementamos medidas técnicas para proteger tu información contra acceso no autorizado.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-3" style={{ color: 'var(--text)' }}>5. Compartición de datos</h2>
            <p>No vendemos ni cedemos tus datos personales a terceros. Solo los compartimos con:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li><strong>Mercado Pago:</strong> para procesar el pago de forma segura</li>
              <li><strong>Empresa de courier:</strong> nombre y dirección para gestionar el despacho</li>
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
            </ul>
            <p className="mt-2">Para ejercer estos derechos, contáctanos por Instagram o correo electrónico.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-3" style={{ color: 'var(--text)' }}>7. Cookies</h2>
            <p>Este sitio utiliza cookies técnicas necesarias para el funcionamiento del carrito de compras y la sesión. No utilizamos cookies de seguimiento publicitario de terceros.</p>
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
