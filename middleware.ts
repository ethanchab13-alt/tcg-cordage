import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const PUBLIC_ROUTES = ['/login', '/register']
const CORDEUR_ROUTES = ['/cordeur']
const CLIENT_ROUTES = ['/dashboard', '/orders']

const CORDEUR_EMAIL = process.env.NEXT_PUBLIC_CORDEUR_EMAIL ?? 'ethanchab13@gmail.com'

function isCordeurUser(user: { email?: string; user_metadata?: Record<string, unknown> }): boolean {
  return (
    user.user_metadata?.role === 'cordeur' ||
    user.email === CORDEUR_EMAIL
  )
}

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

  const { data: { user } } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  // 1. Pas connecté → login
  if (!user && !PUBLIC_ROUTES.some((r) => pathname.startsWith(r))) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (user) {
    const cordeur = isCordeurUser(user)

    // 2. Déjà connecté sur login/register → rediriger vers le bon dashboard
    if (PUBLIC_ROUTES.some((r) => pathname.startsWith(r))) {
      const url = request.nextUrl.clone()
      url.pathname = cordeur ? '/cordeur/dashboard' : '/dashboard'
      return NextResponse.redirect(url)
    }

    // 3. Client essaie d'accéder à l'espace cordeur → refusé
    if (CORDEUR_ROUTES.some((r) => pathname.startsWith(r)) && !cordeur) {
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard'
      return NextResponse.redirect(url)
    }

    // 4. Cordeur essaie d'accéder à l'espace client → redirigé
    if (CLIENT_ROUTES.some((r) => pathname.startsWith(r)) && cordeur) {
      const url = request.nextUrl.clone()
      url.pathname = '/cordeur/dashboard'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|icons|manifest.json|sw.js|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
