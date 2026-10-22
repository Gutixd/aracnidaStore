'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Save, Send, Bot, UserRound } from 'lucide-react'
import { saveAssistantConfig, testAssistant } from '@/lib/actions/assistant'

const PLACEHOLDER = `Ejemplos de lo que puedes escribir aquí:
- Horario de respuesta: lunes a sábado de 10:00 a 20:00.
- Los trajes son de lycra elástica y se lavan a mano con agua fría.
- No hacemos ventas por mayor por ahora.
- Si preguntan por Black Friday: empieza el 27 de noviembre, los precios se anuncian ese día.
- Los peluches de Sanrio son unidades únicas: si ya no aparecen en la web, se agotaron.`

export function AdminAssistantConfig({ enabled, knowledge, ready }: { enabled: boolean; knowledge: string; ready: boolean }) {
  const router = useRouter()
  const [on, setOn] = useState(enabled)
  const [text, setText] = useState(knowledge)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState<string | null>(null)

  const [q, setQ] = useState('Hola! tienen el de Miles Morales en talla 170? cuánto sale el envío a Viña?')
  const [testing, setTesting] = useState(false)
  const [answer, setAnswer] = useState<{ reply: string; needs_human: boolean; reason: string } | null>(null)
  const [testErr, setTestErr] = useState<string | null>(null)

  async function save(nextOn = on) {
    setSaving(true)
    setSaved(null)
    const res = await saveAssistantConfig({ enabled: nextOn, knowledge: text })
    setSaving(false)
    setSaved(res.error ?? 'Guardado')
    router.refresh()
  }

  async function test() {
    setTesting(true)
    setAnswer(null)
    setTestErr(null)
    const res = await testAssistant(q, text)
    setTesting(false)
    if ('error' in res && res.error) setTestErr(res.error)
    else if ('reply' in res) setAnswer({ reply: res.reply, needs_human: res.needs_human, reason: res.reason })
  }

  const labelCls = 'text-xs font-bold uppercase tracking-widest mb-2 block'
  const labelStyle = { color: 'var(--gray-400)' }

  return (
    <div className="space-y-5">
      <div className="card p-5 flex items-center justify-between gap-4">
        <div>
          <p className="font-bold" style={{ color: 'var(--text)' }}>Respuestas automáticas</p>
          <p className="text-xs mt-1" style={{ color: 'var(--gray-600)' }}>
            {on ? 'La IA responde los mensajes nuevos de Instagram.' : 'Apagado: los mensajes solo se guardan aquí.'}
            {!ready && on && ' Falta terminar la configuración de Meta (abajo): mientras tanto no llega nada.'}
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={on}
          disabled={saving}
          onClick={() => { const n = !on; setOn(n); save(n) }}
          className="relative w-14 h-8 rounded-full transition-colors shrink-0"
          style={{ background: on ? '#15803d' : 'var(--gray-200)' }}
        >
          <span className="absolute top-1 w-6 h-6 rounded-full bg-white transition-all" style={{ left: on ? 28 : 4 }} />
        </button>
      </div>

      <div className="card p-5 space-y-3">
        <div>
          <span className={labelCls} style={labelStyle}>Lo que la IA debe saber (además de la web)</span>
          <p className="text-xs mb-3" style={{ color: 'var(--gray-600)' }}>
            El catálogo, precios, stock por talla, trajes en camino, envíos y políticas los lee solo desde la tienda.
            Aquí agrega lo que no está en la web.
          </p>
          <textarea value={text} onChange={(e) => setText(e.target.value)} rows={9} maxLength={8000}
            className="input-field text-sm" placeholder={PLACEHOLDER} />
        </div>
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => save()} disabled={saving} className="btn-primary text-sm !py-2.5">
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />} Guardar
          </button>
          {saved && <span className="text-xs font-semibold" style={{ color: saved === 'Guardado' ? '#15803d' : 'var(--red)' }}>{saved}</span>}
        </div>
      </div>

      <div className="card p-5 space-y-3">
        <span className={labelCls} style={labelStyle}>Pruébala (no envía nada)</span>
        <textarea value={q} onChange={(e) => setQ(e.target.value)} rows={2} className="input-field text-sm" />
        <button type="button" onClick={test} disabled={testing} className="btn-primary text-sm !py-2.5">
          {testing ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />} Ver qué respondería
        </button>
        {testErr && <p className="text-sm" style={{ color: 'var(--red)' }}>{testErr}</p>}
        {answer && (
          <div className="space-y-2">
            <div className="flex gap-2 items-start">
              <UserRound size={16} className="mt-1 shrink-0" style={{ color: 'var(--gray-400)' }} />
              <p className="text-sm rounded-2xl px-3 py-2" style={{ background: 'var(--gray-50)', color: 'var(--text)' }}>{q}</p>
            </div>
            <div className="flex gap-2 items-start">
              <Bot size={16} className="mt-1 shrink-0" style={{ color: '#1d4ed8' }} />
              <p className="text-sm rounded-2xl px-3 py-2 whitespace-pre-wrap" style={{ background: 'rgba(37,99,235,.08)', color: 'var(--text)' }}>{answer.reply}</p>
            </div>
            {answer.needs_human && (
              <p className="text-xs font-semibold" style={{ color: '#b45309' }}>
                La derivaría a ti (te llega aviso por Telegram): {answer.reason}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
