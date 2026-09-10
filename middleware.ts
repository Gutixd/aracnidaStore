import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const isAdminRoute = request.nextUrl.pathname.startsWith('/admin')
  const isLoginPage = request.nextUrl.pathname === '/admin/login'

  // Tener sesión NO es lo mismo que ser administrador. El panel consulta la
  // base con la service role key (que ignora RLS), así que si dejáramos pasar
  // a cualquier cuenta autenticada quedarían expuestos pedidos, datos de
  // clientes y gastos. Se exige pertenecer a `admin_users`.
  //
  // Esa comprobación (`rpc is_admin`) es un viaje extra a la base, y
  // app/admin/layout.tsx la repite en CADA navegación del panel — ahí es
  // donde de verdad protege, porque es lo último antes de leer datos con la
  // service role key. Hacerla también acá duplicaba la latencia sin agregar
  // seguridad, así que queda solo donde cambia el comportamiento: en el
  // login, para no mostrarle el formulario a alguien que ya entró.
  if (isLoginPage) {
    if (user) {
      const { data } = await supabase.rpc('is_admin')
      if (data === true) {
        const url = request.nextUrl.clone()
        url.pathname = '/admin'
        return NextResponse.redirect(url)
      }
    }
  } else if (isAdminRoute && !user) {
    // Sin sesión no hay nada que consultar: al login directo. Si hay sesión
    // pero no es admin, el layout lo devuelve al login con este mismo aviso.
    const url = request.nextUrl.clone()
    url.pathname = '/admin/login'
    url.searchParams.set('error', 'sin-permisos')
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/admin/:path*'],
}
