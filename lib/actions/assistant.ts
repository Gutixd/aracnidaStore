'use server'

import { createAdminClient } from '@/lib/supabase/server'
import { isAdmin } from '@/lib/auth/admin'
import { revalidatePath } from 'next/cache'
import { previewAssistantReply, isAssistantModelConfigured } from '@/lib/ig-assistant'

/** Guarda el interruptor y el conocimiento extra del asistente de Instagram. */
export async function saveAssistantConfig(input: { enabled: boolean; knowledge: string }) {
  if (!(await isAdmin())) return { error: 'No autorizado' }
  const supabase = await createAdminClient()
  const { error } = await supabase
    .from('assistant_config')
    .update({
      enabled: input.enabled,
      knowledge: input.knowledge.slice(0, 8000),
      updated_at: new Date().toISOString(),
    })
    .eq('id', 1)
  if (error) return { error: 'No se pudo guardar' }
  revalidatePath('/admin/assistant')
  return { ok: true }
}

/** Vuelve a activar la IA en una conversación pausada. */
export async function resumeConversation(igUserId: string) {
  if (!(await isAdmin())) return { error: 'No autorizado' }
  const supabase = await createAdminClient()
  await supabase.from('ig_conversations').update({ paused_until: null, pause_reason: null }).eq('ig_user_id', igUserId)
  revalidatePath('/admin/assistant')
  return { ok: true }
}

/** Pausa la IA en una conversación (para atenderla tú). */
export async function pauseConversationManually(igUserId: string) {
  if (!(await isAdmin())) return { error: 'No autorizado' }
  const supabase = await createAdminClient()
  await supabase.from('ig_conversations').update({
    paused_until: new Date(Date.now() + 7 * 24 * 3600_000).toISOString(),
    pause_reason: 'La pausaste tú',
  }).eq('ig_user_id', igUserId)
  revalidatePath('/admin/assistant')
  return { ok: true }
}

/** Prueba la IA sin enviar nada a Instagram. */
export async function testAssistant(message: string, knowledge: string) {
  if (!(await isAdmin())) return { error: 'No autorizado' }
  if (!isAssistantModelConfigured()) return { error: 'Falta GROQ_API_KEY (o ANTHROPIC_API_KEY) en el servidor' }
  const text = message.trim().slice(0, 1000)
  if (!text) return { error: 'Escribe un mensaje de prueba' }
  const out = await previewAssistantReply(text, knowledge.slice(0, 8000))
  if (!out) return { error: 'La IA no pudo responder. Revisa los registros del servidor.' }
  return { ok: true as const, ...out }
}
