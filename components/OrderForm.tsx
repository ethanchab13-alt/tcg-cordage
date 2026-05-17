'use client'

import { useState } from 'react'
import type { StringingOrder } from '@/types/database'

// Cordages courants proposés en suggestions
const STRING_SUGGESTIONS = [
  'Luxilon ALU Power 1.25',
  'Luxilon ALU Power 1.27',
  'Babolat RPM Blast 1.25',
  'Wilson NXT 16',
  'Tecnifibre X-One Biphase 1.24',
  'Head Lynx 1.25',
  'Solinco Tour Bite 1.25',
]

interface OrderFormProps {
  onOrderCreated: (order: StringingOrder) => void
}

export default function OrderForm({ onOrderCreated }: OrderFormProps) {
  const [open, setOpen]                   = useState(false)
  const [racketBrand, setRacketBrand]     = useState('')
  const [stringType, setStringType]       = useState('')
  const [tensionMains, setTensionMains]   = useState('25')
  const [tensionCross, setTensionCross]   = useState('')
  const [notes, setNotes]                 = useState('')
  const [error, setError]                 = useState<string | null>(null)
  const [loading, setLoading]             = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        racket_brand:  racketBrand.trim() || null,
        string_type:   stringType.trim(),
        tension_mains: parseFloat(tensionMains),
        tension_cross: tensionCross ? parseFloat(tensionCross) : null,
        notes:         notes.trim() || null,
      }),
    })

    const json = await res.json()

    if (!res.ok) {
      const debugInfo = [
        json.error,
        json.debug_message && `[${json.debug_code}] ${json.debug_message}`,
        json.debug_hint && `Hint: ${json.debug_hint}`,
        json.debug_details && `Details: ${json.debug_details}`,
      ].filter(Boolean).join(' — ')
      setError(debugInfo || 'Une erreur est survenue.')
      setLoading(false)
      return
    }

    // Reset formulaire
    setRacketBrand('')
    setStringType('')
    setTensionMains('25')
    setTensionCross('')
    setNotes('')
    setOpen(false)
    setLoading(false)

    onOrderCreated(json.order as StringingOrder)
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="btn-primary w-full flex items-center justify-center gap-2 py-3"
      >
        <svg
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
        Déposer une raquette
      </button>
    )
  }

  return (
    <div className="card border-[#006341]/30 bg-[#f7fcfa]">
      <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <span className="text-[#006341]">🎾</span> Nouvelle demande de cordage
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Marque raquette */}
        <div>
          <label htmlFor="racketBrand" className="form-label">
            Marque / modèle de raquette{' '}
            <span className="text-gray-400 font-normal">(optionnel)</span>
          </label>
          <input
            id="racketBrand"
            type="text"
            value={racketBrand}
            onChange={(e) => setRacketBrand(e.target.value)}
            placeholder="ex : Wilson Pro Staff 97"
            className="form-input"
          />
        </div>

        {/* Type de cordage */}
        <div className="relative">
          <label htmlFor="stringType" className="form-label">
            Type de cordage <span className="text-red-500">*</span>
          </label>
          <input
            id="stringType"
            type="text"
            required
            value={stringType}
            onChange={(e) => {
              setStringType(e.target.value)
              setShowSuggestions(true)
            }}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
            placeholder="ex : Luxilon ALU Power 1.25"
            className="form-input"
            autoComplete="off"
          />
          {/* Autocomplete suggestions */}
          {showSuggestions && (
            <ul className="absolute z-10 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg overflow-hidden text-sm">
              {STRING_SUGGESTIONS.filter((s) =>
                s.toLowerCase().includes(stringType.toLowerCase())
              ).map((s) => (
                <li
                  key={s}
                  onMouseDown={() => {
                    setStringType(s)
                    setShowSuggestions(false)
                  }}
                  className="px-3 py-2 cursor-pointer hover:bg-[#e8f5ef] hover:text-[#006341] transition-colors"
                >
                  {s}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Tensions */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="tensionMains" className="form-label">
              Tension mains (kg) <span className="text-red-500">*</span>
            </label>
            <input
              id="tensionMains"
              type="number"
              required
              min={15}
              max={35}
              step={0.5}
              value={tensionMains}
              onChange={(e) => setTensionMains(e.target.value)}
              className="form-input"
            />
          </div>
          <div>
            <label htmlFor="tensionCross" className="form-label">
              Tension croisées{' '}
              <span className="text-gray-400 font-normal">(opt.)</span>
            </label>
            <input
              id="tensionCross"
              type="number"
              min={15}
              max={35}
              step={0.5}
              value={tensionCross}
              onChange={(e) => setTensionCross(e.target.value)}
              placeholder="= mains"
              className="form-input"
            />
          </div>
        </div>

        {/* Notes */}
        <div>
          <label htmlFor="notes" className="form-label">
            Notes{' '}
            <span className="text-gray-400 font-normal">(optionnel)</span>
          </label>
          <textarea
            id="notes"
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="ex : grip 3, urgence avant tournoi..."
            className="form-input resize-none"
          />
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2.5 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="btn-secondary flex-1"
            disabled={loading}
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary flex-1"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <Spinner /> Envoi…
              </span>
            ) : (
              'Envoyer la demande'
            )}
          </button>
        </div>
      </form>
    </div>
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
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
    </svg>
  )
}
