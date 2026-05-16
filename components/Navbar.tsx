'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { UserRole } from '@/types/database'

interface NavbarProps {
  role: UserRole
  fullName?: string | null
}

export default function Navbar({ role, fullName }: NavbarProps) {
  const router = useRouter()
  const supabase = createClient()

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const isCordeur = role === 'cordeur'

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white shadow-sm">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        {/* Logo + titre */}
        <Link
          href={isCordeur ? '/cordeur/dashboard' : '/dashboard'}
          className="flex items-center gap-2.5"
        >
          <Image
            src="/icons/tcg-logo.png"
            alt="TCG"
            width={32}
            height={32}
            className="rounded-full"
          />
          <span className="font-semibold text-[#006341] text-sm leading-none">
            TCG Cordage
          </span>
        </Link>

        {/* Navigation cordeur */}
        {isCordeur && (
          <nav className="hidden sm:flex items-center gap-1">
            <NavLink href="/cordeur/dashboard">Dashboard</NavLink>
            <NavLink href="/cordeur/history">Historique</NavLink>
            <NavLink href="/cordeur/accounting">Comptabilité</NavLink>
          </nav>
        )}

        {/* Droite : nom + déconnexion */}
        <div className="flex items-center gap-3">
          {fullName && (
            <span className="hidden sm:block text-sm text-gray-500 truncate max-w-[140px]">
              {fullName}
            </span>
          )}
          {isCordeur && (
            <span className="badge badge-in_progress text-xs">Cordeur</span>
          )}
          <button
            onClick={handleSignOut}
            className="text-sm text-gray-500 hover:text-[#006341] transition-colors"
            aria-label="Se déconnecter"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.8}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h6a2 2 0 012 2v1"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Nav mobile cordeur */}
      {isCordeur && (
        <nav className="sm:hidden flex border-t border-gray-100 bg-white">
          <MobileNavLink href="/cordeur/dashboard">Dashboard</MobileNavLink>
          <MobileNavLink href="/cordeur/history">Historique</MobileNavLink>
          <MobileNavLink href="/cordeur/accounting">Comptabilité</MobileNavLink>
        </nav>
      )}
    </header>
  )
}

function NavLink({
  href,
  children,
}: {
  href: string
  children: React.ReactNode
}) {
  return (
    <Link
      href={href}
      className="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600
                 hover:text-[#006341] hover:bg-[#e8f5ef] transition-colors"
    >
      {children}
    </Link>
  )
}

function MobileNavLink({
  href,
  children,
}: {
  href: string
  children: React.ReactNode
}) {
  return (
    <Link
      href={href}
      className="flex-1 py-2 text-center text-xs font-medium text-gray-600
                 hover:text-[#006341] hover:bg-[#e8f5ef] transition-colors"
    >
      {children}
    </Link>
  )
}
