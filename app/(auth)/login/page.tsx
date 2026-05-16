'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

const CORDEUR_EMAIL = process.env.NEXT_PUBLIC_CORDEUR_EMAIL ?? 'ethanchab13@gmail.com'

export default function LoginPage() {
  const supabase = createClient()

  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState<string | null>(null)
  const [loading, setLoading]   = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError) {
      setError('Email ou mot de passe incorrect.')
      setLoading(false)
      return
    }

    // Détection du rôle : user_metadata en priorité, puis email fallback
    const metaRole = data.user?.user_metadata?.role as string | undefined
    const isCordeur =
      metaRole === 'cordeur' ||
      data.user?.email === CORDEUR_EMAIL

    // Rechargement complet de la page pour que le middleware réévalue la session
    window.location.href = isCordeur ? '/cordeur/dashboard' : '/dashboard'
  }

  return (
    <>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Connexion</h1>
      <p className="text-sm text-gray-500 mb-6">
        Accédez à votre espace de suivi
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="form-label">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="vous@email.com"
            className="form-input"
          />
        </div>

        <div>
          <label htmlFor="password" className="form-label">
            Mot de passe
          </label>
          <input
            id="password"
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="form-input"
          />
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2.5 text-sm text-red-700">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full mt-2"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <Spinner />
              Connexion…
            </span>
          ) : (
            'Se connecter'
          )}
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-gray-500">
        Pas encore de compte ?{' '}
        <Link
          href="/register"
          className="font-semibold text-[#006341] hover:underline"
        >
          Créer un compte
        </Link>
      </p>
    </>
  )
}

function Spinner() {
  return (
    <svg
      className="h-4 w-4 animate-spin"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v8H4z"
      />
    </svg>
  )
}
