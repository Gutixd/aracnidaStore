'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Loader2, Lock } from 'lucide-react'

export default function AdminLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError('Credenciales incorrectas. Verifica tu email y contraseña.')
      setLoading(false)
      return
    }

    router.push('/admin')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4"
      style={{ background: 'radial-gradient(ellipse at top, #1a2744 0%, #0a0a0a 60%)' }}>
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-red-900/20 border border-red-800/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Lock size={24} className="text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-white">
            <span className="text-red-500">Admin</span> Panel
          </h1>
          <p className="text-sm text-white/30 mt-1">AracnidaStore</p>
        </div>

        {/* Form */}
        <div className="bg-[#111827] border border-white/5 rounded-2xl p-6">
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white/60 mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@aracnidastore.cl"
                required
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder:text-white/20 focus:outline-none focus:border-red-600/50 transition-all text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/60 mb-1.5">Contraseña</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder:text-white/20 focus:outline-none focus:border-red-600/50 transition-all text-sm"
              />
            </div>

            {error && (
              <div className="bg-red-900/20 border border-red-800/30 rounded-lg p-3 text-sm text-red-400">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-white transition-all disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg, #c0392b, #a93226)' }}
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Iniciando sesión...
                </>
              ) : (
                'Ingresar al panel'
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-white/20 mt-6">
          Solo personal autorizado
        </p>
      </div>
    </div>
  )
}
