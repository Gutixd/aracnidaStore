import { formatPrice } from '@/lib/utils'
import { Mail, MailX } from 'lucide-react'

export interface CustomerRow {
  email: string
  name: string | null
  phone: string | null
  pedidos: number
  total_gastado: number
  ultima_compra: string
  acepta_ofertas: boolean
}

/**
 * Lista de clientes. En pantallas anchas es una tabla; bajo `lg` se dibuja
 * como tarjetas apiladas.
 *
 * Antes era solo la tabla dentro de un `overflow-x-auto`: en un celular eso
 * significa 6 columnas comprimidas y scroll lateral para llegar a "Total
 * gastado", que es justo el dato que uno va a mirar. La tarjeta pone lo
 * importante arriba y elimina el desplazamiento horizontal.
 */
export function AdminCustomersList({ customers }: { customers: CustomerRow[] }) {
  return (
    <>
      {/* ── Tarjetas (móvil y tablet) ── */}
      <div className="lg:hidden space-y-3">
        {customers.map((c) => (
          <div key={c.email} className="card p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-bold truncate" style={{ color: 'var(--text)' }}>{c.name || '—'}</p>
                {/* break-all: un correo largo desbordaba la tarjeta */}
                <p className="text-sm break-all" style={{ color: 'var(--gray-600)' }}>{c.email}</p>
                {c.phone && <p className="text-xs mt-0.5" style={{ color: 'var(--gray-400)' }}>{c.phone}</p>}
              </div>
              <OfertasBadge acepta={c.acepta_ofertas} />
            </div>

            <div className="mt-3 pt-3 flex items-end justify-between gap-3" style={{ borderTop: '1px solid var(--gray-100)' }}>
              <div>
                <p className="text-xs" style={{ color: 'var(--gray-400)' }}>
                  {c.pedidos} {c.pedidos === 1 ? 'pedido' : 'pedidos'}
                </p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--gray-400)' }}>
                  Última: {new Date(c.ultima_compra).toLocaleDateString('es-CL')}
                </p>
              </div>
              <p className="text-lg font-black tabular-nums shrink-0" style={{ color: 'var(--text)' }}>
                {formatPrice(c.total_gastado)}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Tabla (escritorio) ── */}
      <div className="hidden lg:block card overflow-hidden">
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
                  <td className="px-4 py-3"><OfertasBadge acepta={c.acepta_ofertas} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}

function OfertasBadge({ acepta }: { acepta: boolean }) {
  return acepta ? (
    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full whitespace-nowrap shrink-0"
      style={{ background: 'rgba(22,163,74,.1)', color: '#15803d' }}>
      <Mail size={11} /> Sí
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full whitespace-nowrap shrink-0"
      style={{ background: 'var(--gray-100)', color: 'var(--gray-400)' }}>
      <MailX size={11} /> No
    </span>
  )
}
