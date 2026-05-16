'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function RegisterPage() {
  const supabase = createClient()

  const [fullName, setFullName]   = useState('')
  const [email, setEmail]         = useState('')
  const [password, setPassword]   = useState('')
  const [confirm, setConfirm]     = useState('')
  const [error, setError]         = useState<string | null>(null)
  const [success, setSuccess]     = useState(false)
  const [loading, setLoading]     = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères.')
      return
    }

    if (password !== confirm) {
      setError('Les mots de passe ne correspondent pas.')
      return
    }

    setLoading(true)

    const { data, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName.trim(),
          role: 'client',
        },
      },
    })

    if (authError) {
      setError(
        authError.message.includes('already registered') || authError.message.includes('already been registered')
          ? 'Cet email est déjà utilisé. Essayez de vous connecter.'
          : `Erreur : ${authError.message}`
      )
      setLoading(false)
      return
    }

    // Créer le profil manuellement (filet de sécurité si le trigger DB ne s'est pas déclenché)
    if (data.user) {
      await supabase.from('profiles').upsert({
        id:        data.user.id,
        email:     email.toLowerCase().trim(),
        full_name: fullName.trim(),
        role:      'client',
      }, { onConflict: 'id' })
    }

    // Si la confirmation email est désactivée → session immédiate → rediriger
    if (data.session) {
      window.location.href = '/dashboard'
      return
    }

    // Sinon → afficher le message de confirmation
    setSuccess(true)
    setLoading(false)
  }

  if (success) {
    return (
      <div className="text-center space-y-3">
        <div className="mx-auto w-14 h-14 rounded-full bg-[#e8f5ef] flex items-center justify-center">
          <svg
            className="w-7 h-7 text-[#006341]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-gray-900">Compte créé !</h2>
        <p className="text-sm text-gray-500">
          Un email de confirmation vous a été envoyé à <strong>{email}</strong>.
          Cliquez sur le lien pour activer votre compte.
        </p>
        <Link href="/login" className="btn-primary inline-block mt-2">
          Aller à la connexion
        </Link>
      </div>
    )
  }

  return (
    <>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Créer un compte</h1>
      <p className="text-sm text-gray-500 mb-6">
        Suivez vos demandes de cordage en ligne
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="fullName" className="form-label">
            Prénom et nom
          </label>
          <input
            id="fullName"
            type="text"
            required
            autoComplete="name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Jean Dupont"
            className="form-input"
          />
        </div>

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
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="8 caractères minimum"
            className="form-input"
          />
        </div>

        <div>
          <label htmlFor="confirm" className="form-label">
            Confirmer le mot de passe
          </label>
          <input
            id="confirm"
            type="password"
            required
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
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
              Création…
            </span>
          ) : (
            'Créer mon compte'
          )}
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-gray-500">
        Déjà un compte ?{' '}
        <Link
          href="/login"
          className="font-semibold text-[#006341] hover:underline"
        >
          Se connecter
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
