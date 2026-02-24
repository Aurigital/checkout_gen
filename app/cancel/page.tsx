'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

type Provider = 'tilopay' | 'onvo'

const PROVIDER_LABELS: Record<Provider, string> = {
  tilopay: 'TiloPay',
  onvo: 'ONVO',
}

function ProviderBadge({ provider }: { provider: Provider | null }) {
  if (!provider) return null
  const label = PROVIDER_LABELS[provider]
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 border border-red-200 text-red-600 text-xs font-medium">
      <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
      Cancelado en {label}
    </span>
  )
}

function CancelContent() {
  const params = useSearchParams()
  const rawProvider = params.get('provider')
  const provider: Provider | null =
    rawProvider === 'tilopay' || rawProvider === 'onvo' ? rawProvider : null

  return (
    <div className="flex flex-col items-center text-center gap-6">
      {/* Icon */}
      <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center">
        <svg
          className="w-10 h-10 text-red-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </div>

      {/* Text */}
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-gray-900">Pago cancelado</h1>
        <p className="text-gray-500 text-sm max-w-xs">
          El pago no fue completado. Podés intentarlo nuevamente cuando quieras.
        </p>
      </div>

      {/* Provider badge */}
      <ProviderBadge provider={provider} />

      {/* CTA */}
      <Link
        href="/"
        className="mt-2 inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-gray-700 active:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-150"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Intentar nuevamente
      </Link>
    </div>
  )
}

export default function CancelPage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
        <Suspense fallback={<div className="h-64 flex items-center justify-center text-gray-400 text-sm">Cargando…</div>}>
          <CancelContent />
        </Suspense>
      </div>
    </main>
  )
}
