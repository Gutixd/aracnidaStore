'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface Props {
  id: string
  active: boolean
  name: string
}

export function AdminToggleProduct({ id, active, name }: Props) {
  const [loading, setLoading] = useState(false)
  const [currentState, setCurrentState] = useState(active)
  const [error, setError] = useState(false)
  const router = useRouter()

  useEffect(() => setCurrentState(active), [active])

  async function toggle() {
    setLoading(true)
    setError(false)
    const supabase = createClient()
    const { error: updError } = await supabase
      .from('products')
      .update({ active: !currentState })
      .eq('id', id)

    if (updError) {
      // Antes esto cambiaba el switch en pantalla aunque la base de datos
      // rechazara el cambio, dejando el producto en un estado distinto al real.
      setError(true)
      setLoading(false)
      return
    }
    setCurrentState(!currentState)
    setLoading(false)
    router.refresh()
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={toggle}
        disabled={loading}
        className="relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-50"
        style={{ background: currentState ? '#16a34a' : 'var(--gray-200)' }}
        title={currentState ? 'Desactivar producto' : 'Activar producto'}
      >
        <span
          className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition duration-200 ease-in-out ${
            currentState ? 'translate-x-4' : 'translate-x-0.5'
          }`}
        />
      </button>
      {error && (
        <span className="text-xs" style={{ color: 'var(--red)' }} title={`No se pudo cambiar el estado de ${name}`}>
          Error
        </span>
      )}
    </div>
  )
}
