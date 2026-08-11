'use server'

import { createAdminClient } from '@/lib/supabase/server'
import { isAdmin } from '@/lib/auth/admin'
import { revalidatePath } from 'next/cache'

export interface InstagramPost {
  id: string
  image_url: string
  caption: string
  scheduled_for: string
  status: 'pendiente' | 'publicado' | 'error'
  ig_media_id: string | null
  error_message: string | null
  posted_at: string | null
  created_at: string
}

export async function getInstagramPosts(): Promise<InstagramPost[]> {
  if (!(await isAdmin())) return []
  const supabase = await createAdminClient()
  const { data } = await supabase
    .from('instagram_posts')
    .select('*')
    .order('scheduled_for', { ascending: true })
  return (data ?? []) as InstagramPost[]
}

/**
 * Sube la imagen al bucket público y crea la publicación programada.
 * `imageBase64` viene del formulario del panel (sin el prefijo data:...).
 */
export async function scheduleInstagramPost(input: {
  imageBase64: string
  imageType: string
  caption: string
  scheduledFor: string // YYYY-MM-DD
}) {
  if (!(await isAdmin())) return { error: 'No autorizado' }
  if (!input.caption.trim()) return { error: 'Falta el texto de la publicación' }
  if (!input.scheduledFor) return { error: 'Falta la fecha' }

  const supabase = await createAdminClient()

  const ext = input.imageType.split('/')[1] ?? 'jpg'
  const path = `${crypto.randomUUID()}.${ext}`
  const bytes = Buffer.from(input.imageBase64, 'base64')

  const { error: uploadErr } = await supabase.storage
    .from('instagram-posts')
    .upload(path, bytes, { contentType: input.imageType, upsert: false })

  if (uploadErr) return { error: 'No se pudo subir la imagen' }

  const { data: pub } = supabase.storage.from('instagram-posts').getPublicUrl(path)

  const { error: insertErr } = await supabase.from('instagram_posts').insert({
    image_url: pub.publicUrl,
    caption: input.caption,
    scheduled_for: input.scheduledFor,
  })

  if (insertErr) return { error: 'No se pudo programar la publicación' }

  revalidatePath('/admin/instagram')
  return { ok: true }
}

export async function deleteInstagramPost(id: string) {
  if (!(await isAdmin())) return { error: 'No autorizado' }
  const supabase = await createAdminClient()

  // Solo se puede borrar lo que aún no se publicó. Un post ya publicado en
  // Instagram no desaparece de ahí por borrar la fila local.
  const { error } = await supabase
    .from('instagram_posts')
    .delete()
    .eq('id', id)
    .eq('status', 'pendiente')

  if (error) return { error: 'No se pudo eliminar' }
  revalidatePath('/admin/instagram')
  return { ok: true }
}
