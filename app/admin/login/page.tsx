'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

export default function AdminLoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const email = username.includes('@') ? username : `${username}@aracnidastore.cl`
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError('Usuario o contraseña incorrectos.')
      setLoading(false)
      return
    }

    router.push('/admin')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4"
      style={{ background: 'linear-gradient(135deg, #1a2744 0%, #0f1e3d 60%, #0a0a0a 100%)' }}>

      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #c0392b, transparent)' }} />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #3d5a9a, transparent)' }} />
        {/* Web lines */}
        <svg className="absolute inset-0 w-full h-full opacity-5" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="web" width="60" height="60" patternUnits="userSpaceOnUse">
              <path d="M0 60 L60 0 M-10 10 L10 -10 M50 70 L70 50" stroke="white" strokeWidth="0.5" fill="none"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#web)"/>
        </svg>
      </div>

      <div className="relative w-full max-w-sm animate-scale-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 animate-float"
            style={{ background: 'linear-gradient(135deg, #c0392b, #96281b)', boxShadow: '0 8px 32px rgba(192,57,43,.4)' }}>
            <svg viewBox="0 0 32 32" fill="none" className="w-9 h-9">
              <circle cx="16" cy="16" r="14" stroke="white" strokeWidth="1.5" opacity=".6"/>
              <path d="M16 3C16 3,9 8,9 16C9 24,16 29,16 29C16 29,23 24,23 16C23 8,16 3,16 3Z" fill="white" opacity=".15"/>
              <path d="M3 16L29 16" stroke="white" strokeWidth="1" opacity=".4"/>
              <path d="M5 9Q16 13 27 9" stroke="white" strokeWidth=".8" fill="none" opacity=".3"/>
              <path d="M5 23Q16 19 27 23" stroke="white" strokeWidth=".8" fill="none" opacity=".3"/>
              <circle cx="16" cy="16" r="3" fill="white"/>
            </svg>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">
            Aracnida<span style={{ color: '#c0392b' }}>Store</span>
          </h1>
          <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,.4)' }}>Panel de administración</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl p-7"
          style={{ background: 'rgba(255,255,255,.06)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,.1)' }}>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold mb-2 uppercase tracking-widest" style={{ color: 'rgba(255,255,255,.5)' }}>
                Usuario
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="gutixd"
                required
                autoComplete="username"
                className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/20 outline-none transition-all"
                style={{
                  background: 'rgba(255,255,255,.08)',
                  border: '1.5px solid rgba(255,255,255,.12)',
                }}
                onFocus={(e) => { e.target.style.borderColor = 'rgba(192,57,43,.6)'; e.target.style.background = 'rgba(255,255,255,.12)' }}
                onBlur={(e) => { e.target.style.borderColor = 'rgba(255,255,255,.12)'; e.target.style.background = 'rgba(255,255,255,.08)' }}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-2 uppercase tracking-widest" style={{ color: 'rgba(255,255,255,.5)' }}>
                Contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                required
                autoComplete="current-password"
                className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/20 outline-none transition-all"
                style={{
                  background: 'rgba(255,255,255,.08)',
                  border: '1.5px solid rgba(255,255,255,.12)',
                }}
                onFocus={(e) => { e.target.style.borderColor = 'rgba(192,57,43,.6)'; e.target.style.background = 'rgba(255,255,255,.12)' }}
                onBlur={(e) => { e.target.style.borderColor = 'rgba(255,255,255,.12)'; e.target.style.background = 'rgba(255,255,255,.08)' }}
              />
            </div>

            {error && (
              <div className="rounded-xl p-3 text-sm flex items-center gap-2"
                style={{ background: 'rgba(192,57,43,.15)', border: '1px solid rgba(192,57,43,.3)', color: '#f87171' }}>
                <span>⚠</span> {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-white text-sm transition-all disabled:opacity-60 mt-2"
              style={{ background: 'linear-gradient(135deg, #c0392b 0%, #e74c3c 100%)', boxShadow: '0 4px 20px rgba(192,57,43,.4)' }}
            >
              {loading ? (
                <><Loader2 size={16} className="animate-spin" />Verificando...</>
              ) : (
                'Ingresar'
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-xs mt-6" style={{ color: 'rgba(255,255,255,.2)' }}>
          Acceso restringido · Solo personal autorizado
        </p>
      </div>
    </div>
  )
}
