import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/server'
import { CHAT_TOPICS, TOPIC_KEYS, topicLabel, type ChatTopic } from '@/lib/chat-topics'
import { Globe, Camera, HelpCircle, MessagesSquare } from 'lucide-react'

export const dynamic = 'force-dynamic'

type Row = {
  id: number
  channel: 'web' | 'instagram'
  question: string
  answer: string | null
  topic: string
  needs_human: boolean
  created_at: string
}

const DAY = 24 * 3600_000

function fecha(iso: string) {
  return new Date(iso).toLocaleString('es-CL', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'America/Santiago',
  })
}

function ChannelIcon({ c }: { c: Row['channel'] }) {
  return c === 'web'
    ? <Globe size={13} aria-label="Web" style={{ color: 'var(--gray-400)' }} />
    : <Camera size={13} aria-label="Instagram" style={{ color: 'var(--gray-400)' }} />
}

function QuestionItem({ r }: { r: Row }) {
  return (
    <li className="py-3" style={{ borderTop: '1px solid var(--gray-100)' }}>
      <div className="flex items-center gap-2 text-[11px] mb-1" style={{ color: 'var(--gray-400)' }}>
        <ChannelIcon c={r.channel} />
        <span>{fecha(r.created_at)}</span>
        <span>·</span>
        <span>{topicLabel(r.topic)}</span>
        {r.needs_human && (
          <span className="px-1.5 py-0.5 rounded font-bold" style={{ background: 'rgba(245,158,11,.12)', color: '#b45309' }}>
            No supo
          </span>
        )}
      </div>
      <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{r.question}</p>
      {r.answer && (
        <details className="mt-1">
          <summary className="text-xs cursor-pointer" style={{ color: 'var(--gray-600)' }}>Ver respuesta de la IA</summary>
          <p className="text-xs mt-1 whitespace-pre-wrap" style={{ color: 'var(--gray-600)' }}>{r.answer}</p>
        </details>
      )}
    </li>
  )
}

export default async function AdminQuestionsPage({
  searchParams,
}: {
  searchParams: Promise<{ tema?: string; dias?: string }>
}) {
  const { tema, dias } = await searchParams
  const days = dias === '7' ? 7 : 30
  const topic = tema && (TOPIC_KEYS as string[]).includes(tema) ? (tema as ChatTopic) : null

  const db = await createAdminClient()
  // eslint-disable-next-line react-hooks/purity -- página dinámica: se calcula en cada visita
  const since = new Date(Date.now() - days * DAY).toISOString()
  const { data } = await db
    .from('chat_questions')
    .select('id, channel, question, answer, topic, needs_human, created_at')
    .gte('created_at', since)
    .order('created_at', { ascending: false })
    .limit(3000)
  const rows = (data ?? []) as Row[]

  const total = rows.length
  const fromWeb = rows.filter((r) => r.channel === 'web').length
  const unanswered = rows.filter((r) => r.needs_human)

  const counts = new Map<string, number>()
  for (const r of rows) counts.set(r.topic, (counts.get(r.topic) ?? 0) + 1)
  const ranking = [...counts.entries()].sort((a, b) => b[1] - a[1])
  const max = ranking[0]?.[1] ?? 1

  const list = topic ? rows.filter((r) => r.topic === topic) : rows
  const href = (p: { tema?: string | null; dias?: number }) => {
    const q = new URLSearchParams()
    const t = p.tema === undefined ? topic : p.tema
    const d = p.dias ?? days
    if (t) q.set('tema', t)
    if (d !== 30) q.set('dias', String(d))
    const s = q.toString()
    return `/admin/questions${s ? `?${s}` : ''}`
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black" style={{ color: 'var(--text)' }}>Qué pregunta la gente</h1>
          <p className="text-sm mt-1 max-w-2xl" style={{ color: 'var(--gray-600)' }}>
            Todo lo que preguntan en el chat de la web y por Instagram, ordenado por tema.
            Las que la IA <strong>no supo responder</strong> son las que conviene mejorar: agrega esa información en{' '}
            <Link href="/admin/assistant" className="underline">Asistente IG</Link> y la IA la usará en ambos chats.
          </p>
        </div>
        <div className="flex gap-1.5">
          {[7, 30].map((d) => (
            <Link key={d} href={href({ dias: d })}
              className="px-3 py-1.5 rounded-lg text-sm font-semibold"
              style={days === d ? { background: 'var(--red)', color: '#fff' } : { background: 'var(--gray-50)', color: 'var(--gray-600)' }}>
              Últimos {d} días
            </Link>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: 'Preguntas', value: total, icon: <MessagesSquare size={16} /> },
          { label: 'Desde la web', value: fromWeb, icon: <Globe size={16} /> },
          { label: 'No supo responder', value: unanswered.length, icon: <HelpCircle size={16} /> },
        ].map((s) => (
          <div key={s.label} className="card p-4">
            <p className="text-xs flex items-center gap-1.5" style={{ color: 'var(--gray-400)' }}>{s.icon} {s.label}</p>
            <p className="text-2xl font-black tabular-nums mt-1" style={{ color: 'var(--text)' }}>{s.value}</p>
          </div>
        ))}
      </div>

      {total === 0 ? (
        <div className="card p-10 text-center">
          <MessagesSquare size={36} className="mx-auto mb-3" style={{ color: 'var(--gray-200)' }} />
          <p className="font-semibold" style={{ color: 'var(--text)' }}>Todavía no hay preguntas en este período</p>
          <p className="text-sm mt-1" style={{ color: 'var(--gray-400)' }}>Aparecerán aquí apenas alguien use el chat de la web o escriba por Instagram.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-6 items-start">
          <div className="space-y-6">
            <div className="card p-5">
              <p className="font-bold mb-3" style={{ color: 'var(--text)' }}>Temas más preguntados</p>
              <ul className="space-y-1">
                {ranking.map(([t, n]) => (
                  <li key={t}>
                    <Link href={href({ tema: topic === t ? null : t })}
                      className="block rounded-lg px-2 py-1.5"
                      style={topic === t ? { background: 'var(--gray-50)' } : undefined}>
                      <div className="flex justify-between text-sm">
                        <span style={{ color: 'var(--text)' }}>{CHAT_TOPICS[t as ChatTopic] ?? 'Otro'}</span>
                        <span className="tabular-nums font-bold" style={{ color: 'var(--gray-600)' }}>
                          {n} <span className="font-normal text-xs">({Math.round((n / total) * 100)}%)</span>
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full mt-1" style={{ background: 'var(--gray-100)' }}>
                        <div className="h-1.5 rounded-full" style={{ width: `${(n / max) * 100}%`, background: 'var(--red)' }} />
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
              {topic && (
                <Link href={href({ tema: null })} className="text-xs underline mt-3 inline-block" style={{ color: 'var(--gray-600)' }}>
                  Ver todos los temas
                </Link>
              )}
            </div>

            {unanswered.length > 0 && (
              <div className="card p-5">
                <p className="font-bold" style={{ color: 'var(--text)' }}>No supo responder ({unanswered.length})</p>
                <p className="text-xs mb-1" style={{ color: 'var(--gray-400)' }}>La IA derivó a WhatsApp o a una persona.</p>
                <ul>{unanswered.slice(0, 15).map((r) => <QuestionItem key={r.id} r={r} />)}</ul>
              </div>
            )}
          </div>

          <div className="card p-5">
            <p className="font-bold" style={{ color: 'var(--text)' }}>
              {topic ? `Preguntas sobre: ${topicLabel(topic)}` : 'Preguntas recientes'}{' '}
              <span className="font-normal text-sm" style={{ color: 'var(--gray-400)' }}>({list.length})</span>
            </p>
            <ul className="mt-1">{list.slice(0, 100).map((r) => <QuestionItem key={r.id} r={r} />)}</ul>
            {list.length > 100 && (
              <p className="text-xs mt-3" style={{ color: 'var(--gray-400)' }}>Se muestran las 100 más recientes.</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
