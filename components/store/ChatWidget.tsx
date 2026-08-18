'use client'

import { useState, useRef, useEffect } from 'react'
import { MessageCircle, X, Send, Loader2 } from 'lucide-react'

interface Message {
  role: 'user' | 'model'
  text: string
}

const WELCOME: Message = {
  role: 'model',
  text: '¡Hola! 🕷️ Soy el asistente de AracnidaStore. Puedo ayudarte con precios, tallas, stock, envíos y retiro. ¿En qué te ayudo?',
}

export function ChatWidget() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([WELCOME])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, open])

  async function send() {
    const text = input.trim()
    if (!text || loading) return

    const next = [...messages, { role: 'user' as const, text }]
    setMessages(next)
    setInput('')
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // No se manda el saludo inicial: es solo de bienvenida, no aporta contexto real.
        body: JSON.stringify({ history: next.slice(1) }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'No se pudo enviar el mensaje')
        return
      }

      setMessages((prev) => [...prev, { role: 'model', text: data.reply }])
    } catch {
      setError('Sin conexión. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {open && (
        <div
          className="mb-3 w-[340px] max-w-[calc(100vw-2.5rem)] rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          style={{ height: 480, background: '#fff', border: '1px solid var(--gray-100)' }}
        >
          <div
            className="px-4 py-3.5 flex items-center justify-between shrink-0"
            style={{ background: 'linear-gradient(135deg, #1a2744 0%, #0f1e3d 100%)' }}
          >
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full" style={{ background: '#4ade80' }} />
              <span className="text-sm font-bold text-white">AracnidaStore</span>
            </div>
            <button onClick={() => setOpen(false)} aria-label="Cerrar chat" className="text-white/60 hover:text-white">
              <X size={18} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2.5" style={{ background: 'var(--gray-50)' }}>
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className="max-w-[85%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap"
                  style={
                    m.role === 'user'
                      ? { background: 'var(--red)', color: '#fff', borderBottomRightRadius: 4 }
                      : { background: '#fff', color: 'var(--text)', border: '1px solid var(--gray-100)', borderBottomLeftRadius: 4 }
                  }
                >
                  {m.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="px-3.5 py-2.5 rounded-2xl" style={{ background: '#fff', border: '1px solid var(--gray-100)' }}>
                  <Loader2 size={14} className="animate-spin" style={{ color: 'var(--gray-400)' }} />
                </div>
              </div>
            )}
            {error && (
              <p className="text-xs text-center px-2" style={{ color: '#dc2626' }}>{error}</p>
            )}
            <div ref={bottomRef} />
          </div>

          <div className="p-2.5 flex items-center gap-2 shrink-0" style={{ borderTop: '1px solid var(--gray-100)', background: '#fff' }}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && send()}
              placeholder="Escribe tu pregunta..."
              disabled={loading}
              className="flex-1 text-sm px-3 py-2 rounded-xl outline-none"
              style={{ background: 'var(--gray-50)', color: 'var(--text)' }}
            />
            <button
              onClick={send}
              disabled={loading || !input.trim()}
              aria-label="Enviar"
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 disabled:opacity-40"
              style={{ background: 'var(--red)', color: '#fff' }}
            >
              <Send size={15} />
            </button>
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? 'Cerrar chat' : 'Abrir chat'}
        className="w-14 h-14 rounded-full shadow-xl flex items-center justify-center transition-transform hover:scale-105"
        style={{ background: 'var(--red)', color: '#fff' }}
      >
        {open ? <X size={24} /> : <MessageCircle size={24} />}
      </button>
    </div>
  )
}
