'use client'

import { useState } from 'react'
import { Ruler, ChevronDown } from 'lucide-react'

interface Row {
  talla: string
  altura: string
  largo: string
  pecho: string
  cintura: string
  cadera: string
}

const ROWS: Row[] = [
  { talla: 'XS / 100', altura: '90–100 cm', largo: '96 cm', pecho: '56–60 cm', cintura: '52–56 cm', cadera: '58–62 cm' },
  { talla: 'S / 110', altura: '100–110 cm', largo: '106 cm', pecho: '60–64 cm', cintura: '56–60 cm', cadera: '62–66 cm' },
  { talla: 'M / 120', altura: '110–120 cm', largo: '116 cm', pecho: '64–68 cm', cintura: '60–64 cm', cadera: '66–70 cm' },
  { talla: 'L / 130', altura: '120–130 cm', largo: '126 cm', pecho: '68–72 cm', cintura: '64–68 cm', cadera: '70–74 cm' },
  { talla: 'XL / 140', altura: '130–140 cm', largo: '136 cm', pecho: '72–76 cm', cintura: '68–72 cm', cadera: '74–80 cm' },
  { talla: '160', altura: '150–160 cm', largo: '146 cm', pecho: '84–92 cm', cintura: '72–80 cm', cadera: '86–94 cm' },
  { talla: '170', altura: '160–170 cm', largo: '156 cm', pecho: '92–100 cm', cintura: '80–88 cm', cadera: '94–102 cm' },
  { talla: '180', altura: '170–180 cm', largo: '166 cm', pecho: '100–108 cm', cintura: '88–96 cm', cadera: '102–110 cm' },
  { talla: '190', altura: '180–190 cm', largo: '176 cm', pecho: '108–116 cm', cintura: '96–104 cm', cadera: '110–118 cm' },
]

export function SizeGuide() {
  const [open, setOpen] = useState(false)

  return (
    <div className="mt-6 rounded-2xl overflow-hidden" style={{ border: '1px solid var(--gray-100)' }}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-5 py-4 transition-colors"
        style={{ background: 'var(--gray-50)', color: 'var(--text)' }}
        aria-expanded={open}
      >
        <span className="flex items-center gap-2.5 font-semibold text-sm">
          <Ruler size={18} style={{ color: 'var(--red)' }} />
          Guía de tallas (medidas en cm)
        </span>
        <ChevronDown
          size={18}
          style={{ color: 'var(--gray-400)', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .25s' }}
        />
      </button>

      {open && (
        <div className="overflow-x-auto" style={{ background: '#fff' }}>
          <table className="w-full text-sm" style={{ borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--gray-50)', color: 'var(--gray-600)' }}>
                <th className="text-left font-semibold px-4 py-3">Talla</th>
                <th className="text-right font-semibold px-4 py-3 whitespace-nowrap">Altura</th>
                <th className="text-right font-semibold px-4 py-3 whitespace-nowrap">Largo traje</th>
                <th className="text-right font-semibold px-4 py-3">Pecho</th>
                <th className="text-right font-semibold px-4 py-3">Cintura</th>
                <th className="text-right font-semibold px-4 py-3">Cadera</th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map((r) => (
                <tr key={r.talla} style={{ borderTop: '1px solid var(--gray-100)' }}>
                  <td className="px-4 py-3 font-bold whitespace-nowrap" style={{ color: 'var(--text)' }}>{r.talla}</td>
                  <td className="px-4 py-3 text-right whitespace-nowrap" style={{ color: 'var(--gray-600)' }}>{r.altura}</td>
                  <td className="px-4 py-3 text-right whitespace-nowrap" style={{ color: 'var(--gray-600)' }}>{r.largo}</td>
                  <td className="px-4 py-3 text-right whitespace-nowrap" style={{ color: 'var(--gray-600)' }}>{r.pecho}</td>
                  <td className="px-4 py-3 text-right whitespace-nowrap" style={{ color: 'var(--gray-600)' }}>{r.cintura}</td>
                  <td className="px-4 py-3 text-right whitespace-nowrap" style={{ color: 'var(--gray-600)' }}>{r.cadera}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="px-4 py-3 text-xs" style={{ color: 'var(--gray-400)', background: 'var(--gray-50)' }}>
            Elige la talla según la <strong>altura</strong> del niño/a. Si está entre dos tallas, te recomendamos la mayor.
          </p>
        </div>
      )}
    </div>
  )
}
