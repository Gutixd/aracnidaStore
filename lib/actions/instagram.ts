'use server'

import { createAdminClient } from '@/lib/supabase/server'
import { isAdmin } from '@/lib/auth/admin'
import { generateInstagramCaption } from '@/lib/claude'
import { revalidatePath } from 'next/cache'

/** Días en que se publica: lunes, miércoles, viernes (0=domingo … 6=sábado). */
const POSTING_WEEKDAYS = [1, 3, 5]

function toISODate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/**
 * Arma el catálogo real (nombre, precio, stock) como texto plano, para que
 * el copy generado por IA nunca invente un precio que no existe.
 */
async function getCatalogText(supabase: Awaited<ReturnType<typeof createAdminClient>>): Promise<string> {
  const { data } = await supabase
    .from('products')
    .select('name, price, stock')
    .eq('active', true)
    .gt('stock', 0)
    .order('price')

  if (!data || data.length === 0) return '(sin productos con stock)'
  return data.map((p) => `${p.name} — $${Number(p.price).toLocaleString('es-CL')} — ${p.stock} en stock`).join('\n')
}

/**
 * Próximo lunes/miércoles/viernes libre, empezando mañana. "Libre" significa
 * que no hay ya una publicación pendiente ese día — así una carga masiva no
 * choca consigo misma ni con algo que se programó a mano.
 */
async function getNextAvailableSlot(supabase: Awaited<ReturnType<typeof createAdminClient>>): Promise<string> {
  const { data: pendientes } = await supabase
    .from('instagram_posts')
    .select('scheduled_for')
    .eq('status', 'pendiente')

  const ocupados = new Set((pendientes ?? []).map((p) => p.scheduled_for))

  const d = new Date()
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + 1) // empieza mañana, no hoy

  for (let i = 0; i < 60; i++) {
    if (POSTING_WEEKDAYS.includes(d.getDay())) {
      const iso = toISODate(d)
      if (!ocupados.has(iso)) {
        ocupados.add(iso) // reserva el cupo dentro de este mismo lote
        return iso
      }
    }
    d.setDate(d.getDate() + 1)
  }
  // No debería pasar nunca (60 días de margen), pero por si acaso.
  return toISODate(d)
}

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

/**
 * Carga masiva: sube la imagen, le pide a Claude que mire la foto y escriba
 * el copy, y le asigna el próximo lunes/miércoles/viernes libre. Se llama
 * una vez por imagen — el cliente decide el orden, así el cupo de cada una
 * queda reservado antes de calcular el de la siguiente.
 */
export async function scheduleInstagramPostAI(input: {
  imageBase64: string
  imageType: string
}) {
  if (!(await isAdmin())) return { error: 'No autorizado' }

  const supabase = await createAdminClient()

  const ext = input.imageType.split('/')[1] ?? 'jpg'
  const path = `${crypto.randomUUID()}.${ext}`
  const bytes = Buffer.from(input.imageBase64, 'base64')

  const { error: uploadErr } = await supabase.storage
    .from('instagram-posts')
    .upload(path, bytes, { contentType: input.imageType, upsert: false })

  if (uploadErr) return { error: 'No se pudo subir la imagen' }

  const { data: pub } = supabase.storage.from('instagram-posts').getPublicUrl(path)

  let caption: string
  try {
    const catalogText = await getCatalogText(supabase)
    caption = await generateInstagramCaption(input.imageBase64, input.imageType, catalogText)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return { error: `No se pudo generar el copy: ${message}` }
  }

  const scheduledFor = await getNextAvailableSlot(supabase)

  const { error: insertErr } = await supabase.from('instagram_posts').insert({
    image_url: pub.publicUrl,
    caption,
    scheduled_for: scheduledFor,
  })

  if (insertErr) return { error: 'No se pudo programar la publicación' }

  revalidatePath('/admin/instagram')
  return { ok: true, caption, scheduledFor }
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
