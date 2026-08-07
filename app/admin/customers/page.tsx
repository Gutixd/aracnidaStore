import { getCustomers } from '@/lib/actions/marketing'
import { AdminCustomersExport } from '@/components/admin/AdminCustomersExport'
import { formatPrice } from '@/lib/utils'
import { Users, Mail, MailX, ShoppingBag } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function AdminCustomersPage() {
  const customers = await getCustomers()

  const conPermiso = customers.filter((c) => c.acepta_ofertas)
  const recurrentes = customers.filter((c) => c.pedidos > 1)

  const tiles = [
    { icon: <Users size={18} />, label: 'Clientes', value: String(customers.length) },
    { icon: <Mail size={18} />, label: 'Aceptan ofertas', value: String(conPermiso.length) },
    { icon: <ShoppingBag size={18} />, label: 'Compraron más de una vez', value: String(recurrentes.length) },
  ]

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-black" style={{ color: 'var(--text)' }}>Clientes</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--gray-400)' }}>
          Armado desde los pedidos pagados. Un cliente aparece una sola vez, aunque haya comprado varias.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        {tiles.map((t) => (
          <div key={t.label} className="card p-5">
            <div className="flex items-center gap-2 mb-2" style={{ color: 'var(--gray-400)' }}>
              {t.icon}
              <span className="text-xs font-semibold uppercase tracking-wide">{t.label}</span>
            </div>
            <p className="text-3xl font-black" style={{ color: 'var(--text)' }}>{t.value}</p>
          </div>
        ))}
      </div>

      {/* La lista de envío no es "todos los clientes": es solo quien dio permiso. */}
      <div className="card p-5 mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="font-bold mb-1" style={{ color: 'var(--text)' }}>Lista para ofertas</p>
            <p className="text-sm" style={{ color: 'var(--gray-400)' }}>
              {conPermiso.length === 0
                ? 'Todavía nadie ha dado permiso. La casilla del checkout empieza a llenar esta lista desde ahora.'
                : `${conPermiso.length} ${conPermiso.length === 1 ? 'persona marcó' : 'personas marcaron'} la casilla al comprar. Solo a estos correos se puede enviar publicidad.`}
            </p>
          </div>
          <AdminCustomersExport customers={conPermiso} />
        </div>
      </div>

      {customers.length === 0 ? (
        <div className="card p-10 text-center">
          <Users size={40} className="mx-auto mb-3" style={{ color: 'var(--gray-300)' }} />
          <p className="font-semibold" style={{ color: 'var(--text)' }}>Aún no hay clientes con pedidos pagados</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--gray-200)' }}>
                  {['Cliente', 'Contacto', 'Pedidos', 'Total gastado', 'Última compra', 'Ofertas'].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wide whitespace-nowrap"
                      style={{ color: 'var(--gray-400)' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {customers.map((c) => (
                  <tr key={c.email} style={{ borderBottom: '1px solid var(--gray-100)' }}>
                    <td className="px-4 py-3 font-semibold whitespace-nowrap" style={{ color: 'var(--text)' }}>
                      {c.name || '—'}
                    </td>
                    <td className="px-4 py-3" style={{ color: 'var(--gray-600)' }}>
                      <span className="block">{c.email}</span>
                      <span className="block text-xs" style={{ color: 'var(--gray-400)' }}>{c.phone || '—'}</span>
                    </td>
                    <td className="px-4 py-3 tabular-nums" style={{ color: 'var(--gray-600)' }}>{c.pedidos}</td>
                    <td className="px-4 py-3 font-bold tabular-nums whitespace-nowrap" style={{ color: 'var(--text)' }}>
                      {formatPrice(c.total_gastado)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap" style={{ color: 'var(--gray-600)' }}>
                      {new Date(c.ultima_compra).toLocaleDateString('es-CL')}
                    </td>
                    <td className="px-4 py-3">
                      {c.acepta_ofertas ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full whitespace-nowrap"
                          style={{ background: 'rgba(22,163,74,.1)', color: '#15803d' }}>
                          <Mail size={11} /> Sí
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full whitespace-nowrap"
                          style={{ background: 'var(--gray-100)', color: 'var(--gray-400)' }}>
                          <MailX size={11} /> No
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <p className="text-xs mt-4 leading-relaxed" style={{ color: 'var(--gray-400)' }}>
        Los clientes que compraron antes de que existiera la casilla aparecen como &quot;No&quot;: nunca se les
        preguntó, así que enviarles publicidad contradiría la Política de Privacidad. Sus datos siguen aquí
        para atender su pedido y su garantía.
      </p>
    </div>
  )
}
