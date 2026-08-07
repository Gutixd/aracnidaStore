import { createClient } from '@/lib/supabase/server'

/**
 * Verificación de administrador.
 *
 * Todo el panel `/admin` y sus acciones usan `createAdminClient()`, que se
 * conecta con la service role key y por diseño **ignora RLS por completo**.
 * Eso significa que las políticas de la base de datos NO protegen esas
 * pantallas: lo único que las protege es lo que comprobemos en el servidor.
 *
 * Antes se comprobaba solo `if (!user)`, es decir "hay sesión iniciada".
 * Cualquier cuenta de Supabase — no solo las del dueño — cumplía esa
 * condición, y con ella podía leer pedidos, nombres, correos, teléfonos,
 * gastos y analítica. Aquí se comprueba lo que corresponde: que ese usuario
 * esté realmente en `public.admin_users`.
 */
export async function isAdmin(): Promise<boolean> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return false

  // `is_admin()` es SECURITY DEFINER y solo responde por el usuario que llama,
  // así que no puede usarse para preguntar por terceros.
  const { data, error } = await supabase.rpc('is_admin')
  if (error) return false

  return data === true
}
