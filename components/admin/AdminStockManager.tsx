'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Plus, Minus, RotateCcw, Loader2 } from 'lucide-react'

interface Props {
  product: { id: string; name: string; stock: number }
}

export function AdminStockManager({ product }: Props) {
  const [quantity, setQuantity] = useState(1)
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [currentStock, setCurrentStock] = useState(product.stock)
  const router = useRouter()

  async function handleAdjust(type: 'increase' | 'decrease' | 'adjust') {
    if (!reason.trim()) { setMessage('Ingresa un motivo'); return }
    if (quantity <= 0) { setMessage('Cantidad inválida'); return }

    setLoading(true)
    setMessage(null)
    const supabase = createClient()

    let newStock: number
    if (type === 'increase') newStock = currentStock + quantity
    else if (type === 'decrease') newStock = Math.max(0, currentStock - quantity)
    else newStock = quantity

    const { error } = await supabase
      .from('products')
      .update({ stock: newStock })
      .eq('id', product.id)

    if (!error) {
      await supabase.from('inventory_movements').insert({
        product_id: product.id,
        type,
        quantity,
        reason,
        previous_stock: currentStock,
        new_stock: newStock,
        created_by: 'admin',
      })
      setCurrentStock(newStock)
      setReason('')
      setMessage(`Stock actualizado: ${newStock} unidades`)
      router.refresh()
    } else {
      setMessage('Error al actualizar stock')
    }
    setLoading(false)
  }

  return (
    <div className="bg-[#111827] border border-white/5 rounded-xl p-6">
      <h2 className="text-sm font-semibold text-white mb-4">Gestión de stock</h2>

      {/* Current stock */}
      <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4 mb-5 text-center">
        <p className="text-xs text-white/40 mb-1">Stock actual</p>
        <p className={`text-4xl font-black ${
          currentStock === 0 ? 'text-red-400' : currentStock <= 3 ? 'text-yellow-400' : 'text-green-400'
        }`}>
          {currentStock}
        </p>
        <p className="text-xs text-white/30 mt-1">unidades disponibles</p>
      </div>

      {/* Quantity input */}
      <div className="mb-4">
        <label className="block text-xs font-medium text-white/50 mb-2">Cantidad</label>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            className="w-8 h-8 bg-white/5 rounded-lg flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-all"
          >
            <Minus size={14} />
          </button>
          <input
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
            className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-center text-white text-sm focus:outline-none focus:border-red-600/50"
          />
          <button
            onClick={() => setQuantity(quantity + 1)}
            className="w-8 h-8 bg-white/5 rounded-lg flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-all"
          >
            <Plus size={14} />
          </button>
        </div>
      </div>

      {/* Reason */}
      <div className="mb-4">
        <label className="block text-xs font-medium text-white/50 mb-2">Motivo *</label>
        <input
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Ej: Reposición de stock, error de conteo..."
          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-red-600/50"
        />
      </div>

      {/* Actions */}
      <div className="grid grid-cols-3 gap-2">
        <button
          onClick={() => handleAdjust('increase')}
          disabled={loading}
          className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-green-900/10 border border-green-800/20 text-green-400 hover:bg-green-900/20 transition-all disabled:opacity-50 text-xs font-medium"
        >
          <Plus size={16} />
          Sumar
        </button>
        <button
          onClick={() => handleAdjust('decrease')}
          disabled={loading}
          className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-red-900/10 border border-red-800/20 text-red-400 hover:bg-red-900/20 transition-all disabled:opacity-50 text-xs font-medium"
        >
          <Minus size={16} />
          Restar
        </button>
        <button
          onClick={() => handleAdjust('adjust')}
          disabled={loading}
          className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-blue-900/10 border border-blue-800/20 text-blue-400 hover:bg-blue-900/20 transition-all disabled:opacity-50 text-xs font-medium"
          title="Ajusta el stock al valor ingresado"
        >
          <RotateCcw size={16} />
          Ajustar
        </button>
      </div>

      {loading && (
        <div className="flex items-center justify-center mt-3 text-white/30 gap-2 text-xs">
          <Loader2 size={12} className="animate-spin" /> Actualizando...
        </div>
      )}

      {message && (
        <p className="text-xs text-center mt-3 text-white/50">{message}</p>
      )}
    </div>
  )
}
