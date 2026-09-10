import { createServerClient } from '@supabase/ssr'
import { createClient as createRawClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {}
        },
      },
    }
  )
}

/**
 * Cliente anónimo SIN cookies, para lecturas públicas de la tienda
 * (catálogo, reseñas aprobadas).
 *
 * createClient() lee cookies(), y con eso Next.js marca la página entera
 * como dinámica: se renderiza de nuevo para cada visitante y nunca se
 * cachea (medido: `x-vercel-cache: MISS` + `no-store` en todas las páginas).
 * Con 100 personas a la vez eso eran 100 renders y ~250 consultas a
 * Supabase para mostrarles exactamente lo mismo. Estas lecturas usan la
 * anon key igual que antes — mismas políticas RLS — pero al no tocar
 * cookies la página puede cachearse y servirse desde la CDN.
 */
export function createPublicClient() {
  return createRawClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

/**
 * Cliente con privilegios de service_role (ignora RLS por completo).
 *
 * A propósito NO usa createServerClient de @supabase/ssr ni pasa cookies:
 * ese cliente restaura la sesión del navegador si existe una, y en ese caso
 * usa el token de ESA sesión (rol "authenticated") en vez de la service
 * role key para autorizar las peticiones — perdiendo en silencio los
 * privilegios de administrador. Esto pasaba desapercibido porque la
 * mayoría de las tablas ya tienen política para admins autenticados, pero
 * fallaba (RLS violation) en tablas de uso puramente interno como
 * `rate_limit_hits`, que no tienen ninguna política pensada para permitir
 * acceso de usuarios "authenticated".
 */
export async function createAdminClient() {
  return createRawClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}
