'use client'

import { Download } from 'lucide-react'
import type { CustomerRow } from '@/lib/actions/marketing'

/**
 * Descarga la lista de envío como CSV, lista para pegar en Resend, Mailchimp
 * o donde se arme la campaña. Solo recibe contactos con permiso: la página
 * filtra antes de pasarlos.
 */
export function AdminCustomersExport({ customers }: { customers: CustomerRow[] }) {
  function download() {
    // Un campo que empiece por = + - @ lo interpreta Excel como fórmula.
    // Se antepone un apóstrofo para que se lea como texto.
    const safe = (v: string | number) => {
      const s = String(v ?? '')
      const escaped = /^[=+\-@]/.test(s) ? `'${s}` : s
      return `"${escaped.replace(/"/g, '""')}"`
    }

    const filas = [
      ['email', 'nombre', 'telefono', 'pedidos', 'total_gastado', 'ultima_compra'],
      ...customers.map((c) => [
        c.email,
        c.name,
        c.phone,
        c.pedidos,
        c.total_gastado,
        new Date(c.ultima_compra).toISOString().slice(0, 10),
      ]),
    ]

    // El BOM hace que Excel abra las tildes y la ñ correctamente.
    const csv = '﻿' + filas.map((f) => f.map(safe).join(',')).join('\r\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }))

    const a = document.createElement('a')
    a.href = url
    a.download = `aracnidastore-lista-ofertas-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <button
      onClick={download}
      disabled={customers.length === 0}
      className="btn-primary inline-flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
    >
      <Download size={16} />
      Descargar CSV
    </button>
  )
}
