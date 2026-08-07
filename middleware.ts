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
  let admin = false
  if (user) {
    const { data } = await supabase.rpc('is_admin')
    admin = data === true
  }

  if (isAdminRoute && !isLoginPage && !admin) {
    // Una sesión válida pero sin permisos se cierra, para no dejar dando
    // vueltas una cookie que el usuario cree que sirve para entrar.
    if (user) await supabase.auth.signOut()
    const url = request.nextUrl.clone()
    url.pathname = '/admin/login'
    url.searchParams.set('error', 'sin-permisos')
    return NextResponse.redirect(url)
  }

  if (isLoginPage && admin) {
    const url = request.nextUrl.clone()
    url.pathname = '/admin'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/admin/:path*'],
}
