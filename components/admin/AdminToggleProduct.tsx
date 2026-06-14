'use client'

import { useState } from 'react'
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
  const router = useRouter()

  async function toggle() {
    setLoading(true)
    const supabase = createClient()
    await supabase
      .from('products')
      .update({ active: !currentState })
      .eq('id', id)
    setCurrentState(!currentState)
    setLoading(false)
    router.refresh()
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-50 ${
        currentState ? 'bg-green-600' : 'bg-white/10'
      }`}
      title={currentState ? 'Desactivar producto' : 'Activar producto'}
    >
      <span
        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition duration-200 ease-in-out ${
          currentState ? 'translate-x-4' : 'translate-x-0.5'
        }`}
      />
    </button>
  )
}
