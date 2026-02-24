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
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-50 border border-green-200 text-green-700 text-xs font-medium">
      <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
      Procesado por {label}
    </span>
  )
}

function SuccessContent() {
  const params = useSearchParams()
  const rawProvider = params.get('provider')
  const provider: Provider | null =
    rawProvider === 'tilopay' || rawProvider === 'onvo' ? rawProvider : null

  return (
    <div className="flex flex-col items-center text-center gap-6">
      {/* Animated check icon */}
      <div className="relative">
        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center animate-[ping_1s_ease-out_1]">
          <div className="absolute w-20 h-20 rounded-full bg-green-100 opacity-60 scale-110" />
        </div>
        <div className="absolute inset-0 w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
          <svg
            className="w-10 h-10 text-green-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 13l4 4L19 7"
              className="[stroke-dasharray:24] [stroke-dashoffset:24] animate-[dash_0.4s_0.1s_ease-out_forwards]"
            />
          </svg>
        </div>
      </div>

      {/* Text */}
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-gray-900">
          ¡Pago procesado exitosamente!
        </h1>
        <p className="text-gray-500 text-sm max-w-xs">
          La transacción fue completada. Podés generar un nuevo link cuando lo necesités.
        </p>
      </div>

      {/* Provider badge */}
      <ProviderBadge provider={provider} />

      {/* CTA */}
      <Link
        href="/"
        className="mt-2 inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700 active:bg-primary-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-all duration-150"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
        Generar otro link
      </Link>
    </div>
  )
}

export default function SuccessPage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
        <Suspense fallback={<div className="h-64 flex items-center justify-center text-gray-400 text-sm">Cargando…</div>}>
          <SuccessContent />
        </Suspense>
      </div>
    </main>
  )
}
