import { createAdminClient } from '@/lib/supabase/server'
import { generateReply, isAssistantModelConfigured } from '@/lib/ig-assistant'

/**
 * Chat de la página web. Usa el mismo asistente que Instagram (Llama en Groq,
 * o Claude si no hay clave de Groq): mismas reglas, mismo catálogo real y el
 * mismo "conocimiento" que el dueño escribe en el panel.
 *
 * Antes usaba Gemini gratis, que tenía un tope de 20 mensajes al día.
 */

export const isChatAssistantEnabled = () => isAssistantModelConfigured()

export interface ChatMessage {
  role: 'user' | 'model'
  text: string
}

export interface ChatReply {
  reply: string
  needsHuman: boolean
}

/** Responde el siguiente turno y deja registrada la pregunta para el panel. */
export async function getChatReply(history: ChatMessage[], sessionId: string | null): Promise<ChatReply> {
  const db = await createAdminClient()
  const { data: config } = await db.from('assistant_config').select('knowledge').eq('id', 1).single()

  const result = await generateReply(
    history.map((m) => ({ author: m.role === 'user' ? 'cliente' : 'ia', text: m.text })),
    config?.knowledge ?? '',
    db,
    'web'
  )
  if (!result) throw new Error('El asistente no devolvió respuesta')

  const question = history[history.length - 1]?.text ?? ''
  const { error } = await db.from('chat_questions').insert({
    channel: 'web',
    session_id: sessionId,
    question: question.slice(0, 1000),
    answer: result.reply.slice(0, 2000),
    topic: result.topic,
    needs_human: result.needs_human,
  })
  if (error) console.error('[Chat] No se pudo guardar la pregunta:', error.message)

  return { reply: result.reply, needsHuman: result.needs_human }
}
