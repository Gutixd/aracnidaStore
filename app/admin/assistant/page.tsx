import { createAdminClient } from '@/lib/supabase/server'
import { dmConfigStatus } from '@/lib/instagram-dm'
import { isAssistantModelConfigured } from '@/lib/ig-assistant'
import { AdminAssistantConfig } from '@/components/admin/AdminAssistantConfig'
import { AdminConversationActions } from '@/components/admin/AdminConversationActions'
import { CopyButton } from '@/components/admin/CopyButton'
import { CheckCircle2, Circle, MessageCircle } from 'lucide-react'

export const dynamic = 'force-dynamic'

type Msg = { ig_user_id: string; author: 'cliente' | 'ia' | 'humano'; text: string; created_at: string }

const WEBHOOK_URL = 'https://aracnidastore.com/api/instagram/webhook'

function hora(iso: string) {
  return new Date(iso).toLocaleString('es-CL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'America/Santiago' })
}

export default async function AdminAssistantPage() {
  const supabase = await createAdminClient()
  const [{ data: config }, { data: convs }] = await Promise.all([
    supabase.from('assistant_config').select('enabled, knowledge').eq('id', 1).single(),
    supabase.from('ig_conversations').select('*').order('last_message_at', { ascending: false }).limit(25),
  ])
  const ids = (convs ?? []).map((c) => c.ig_user_id as string)
  const { data: msgs } = ids.length
    ? await supabase.from('ig_messages').select('ig_user_id, author, text, created_at')
        .in('ig_user_id', ids).order('created_at', { ascending: false }).limit(400)
    : { data: [] }
  const byConv = new Map<string, Msg[]>()
  for (const m of (msgs ?? []) as Msg[]) byConv.set(m.ig_user_id, [m, ...(byConv.get(m.ig_user_id) ?? [])])

  const env = dmConfigStatus()
  const llm = isAssistantModelConfigured()
  const anyMessage = (convs ?? []).length > 0
  const steps = [
    { ok: llm, label: 'Clave de Claude (ANTHROPIC_API_KEY) en Vercel' },
    { ok: env.appSecret, label: 'INSTAGRAM_APP_SECRET en Vercel' },
    { ok: env.verifyToken, label: 'INSTAGRAM_WEBHOOK_VERIFY_TOKEN en Vercel' },
    { ok: env.accessToken, label: 'INSTAGRAM_ACCESS_TOKEN con permiso de mensajes' },
    { ok: anyMessage, label: 'Webhook conectado en Meta (llegó al menos un mensaje)' },
  ]
  const ready = steps.every((s) => s.ok)
  // eslint-disable-next-line react-hooks/purity -- página dinámica: se calcula en cada visita
  const now = Date.now()

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-black" style={{ color: 'var(--text)' }}>Asistente de Instagram</h1>
        <p className="text-sm mt-1 max-w-2xl" style={{ color: 'var(--gray-600)' }}>
          Responde los mensajes directos con IA usando el catálogo real de la tienda y lo que escribas aquí.
          Si no sabe algo o el cliente necesita a una persona, te avisa por Telegram y se calla en ese chat.
          Si respondes tú desde Instagram, la IA se aparta 12 horas en esa conversación.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[440px_1fr] gap-6 items-start">
        <div className="space-y-5">
          <AdminAssistantConfig enabled={!!config?.enabled} knowledge={config?.knowledge ?? ''} ready={ready} />

          <div className="card p-5">
            <p className="font-bold mb-3" style={{ color: 'var(--text)' }}>Configuración</p>
            <ul className="space-y-2">
              {steps.map((s) => (
                <li key={s.label} className="flex items-start gap-2 text-sm" style={{ color: s.ok ? 'var(--text)' : 'var(--gray-600)' }}>
                  {s.ok ? <CheckCircle2 size={16} className="mt-0.5 shrink-0" style={{ color: '#15803d' }} />
                    : <Circle size={16} className="mt-0.5 shrink-0" style={{ color: 'var(--gray-200)' }} />}
                  {s.label}
                </li>
              ))}
            </ul>
            <p className="text-xs mt-4 mb-1 font-semibold" style={{ color: 'var(--gray-600)' }}>URL del webhook (para Meta):</p>
            <div className="flex items-center gap-2">
              <code className="text-xs px-2 py-1.5 rounded-lg break-all" style={{ background: 'var(--gray-50)' }}>{WEBHOOK_URL}</code>
              <CopyButton text={WEBHOOK_URL} title="Copiar URL" />
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {(convs ?? []).length === 0 ? (
            <div className="card p-10 text-center">
              <MessageCircle size={36} className="mx-auto mb-3" style={{ color: 'var(--gray-200)' }} />
              <p className="font-semibold" style={{ color: 'var(--text)' }}>Aún no llegan mensajes</p>
              <p className="text-sm mt-1" style={{ color: 'var(--gray-400)' }}>Aparecerán aquí cuando Meta esté conectado.</p>
            </div>
          ) : (
            (convs ?? []).map((c) => {
              const paused = !!c.paused_until && new Date(c.paused_until).getTime() > now
              const list = (byConv.get(c.ig_user_id) ?? []).slice(-12)
              return (
                <div key={c.ig_user_id} className="card overflow-hidden">
                  <div className="px-4 py-3 flex flex-wrap items-center justify-between gap-2" style={{ borderBottom: '1px solid var(--gray-100)' }}>
                    <div>
                      <p className="font-bold text-sm" style={{ color: 'var(--text)' }}>{c.username ? `@${c.username}` : `Cliente ${String(c.ig_user_id).slice(-6)}`}</p>
                      <p className="text-xs" style={{ color: paused ? '#b45309' : 'var(--gray-400)' }}>
                        {paused ? `IA en pausa · ${c.pause_reason ?? ''}` : `Último mensaje ${hora(c.last_message_at)}`}
                      </p>
                    </div>
                    <AdminConversationActions igUserId={c.ig_user_id} paused={paused} />
                  </div>
                  <div className="p-4 space-y-2">
                    {list.map((m, i) => (
                      <div key={i} className={`flex ${m.author === 'cliente' ? 'justify-start' : 'justify-end'}`}>
                        <div className="max-w-[85%] rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap"
                          style={m.author === 'cliente'
                            ? { background: 'var(--gray-50)', color: 'var(--text)' }
                            : m.author === 'ia'
                              ? { background: 'rgba(37,99,235,.08)', color: 'var(--text)' }
                              : { background: 'rgba(22,163,74,.1)', color: 'var(--text)' }}>
                          {m.text}
                          <span className="block text-[10px] mt-1" style={{ color: 'var(--gray-400)' }}>
                            {m.author === 'ia' ? 'IA · ' : m.author === 'humano' ? 'Tú · ' : ''}{hora(m.created_at)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
