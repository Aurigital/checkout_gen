'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'

// ---------------------------------------------------------------------------
// Logout button
// ---------------------------------------------------------------------------

function LogoutButton() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleLogout = async () => {
    setLoading(true)
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } finally {
      router.push('/login')
      router.refresh()
    }
  }

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      title="Cerrar sesión"
      aria-label="Cerrar sesión"
      className="fixed top-4 right-4 z-40 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-gray-200 shadow-sm text-xs font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {loading ? (
        <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      ) : (
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
      )}
      Salir
    </button>
  )
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Currency = 'USD' | 'CRC'
type PaymentType = 'one_time' | 'recurring'
type Provider = 'tilopay' | 'onvo'

interface Toast {
  id: number
  type: 'success' | 'error'
  message: string
  url?: string
}

// ---------------------------------------------------------------------------
// Toggle component
// ---------------------------------------------------------------------------

function Toggle<T extends string>({
  options,
  value,
  onChange,
  disabled,
}: {
  options: { value: T; label: string }[]
  value: T
  onChange: (v: T) => void
  disabled?: boolean
}) {
  return (
    <div className="inline-flex rounded-lg border border-gray-200 bg-gray-100 p-1 gap-1">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          disabled={disabled}
          className={[
            'px-4 py-1.5 rounded-md text-sm font-medium transition-all duration-150',
            'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            value === opt.value
              ? 'bg-white text-primary-700 shadow-sm border border-gray-200'
              : 'text-gray-500 hover:text-gray-700',
          ].join(' ')}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Toast notification
// ---------------------------------------------------------------------------

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: Toast
  onDismiss: (id: number) => void
}) {
  return (
    <div
      className={[
        'flex items-start gap-3 w-full max-w-sm rounded-xl shadow-lg px-4 py-3 text-sm',
        'animate-in slide-in-from-bottom-2 duration-300',
        toast.type === 'success'
          ? 'bg-white border border-green-200'
          : 'bg-white border border-red-200',
      ].join(' ')}
    >
      {/* Icon */}
      <span className="mt-0.5 shrink-0">
        {toast.type === 'success' ? (
          <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        )}
      </span>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className={toast.type === 'success' ? 'text-gray-800 font-medium' : 'text-red-700 font-medium'}>
          {toast.message}
        </p>
        {toast.url && (
          <p className="mt-1 text-gray-500 text-xs truncate font-mono">{toast.url}</p>
        )}
      </div>

      {/* Dismiss */}
      <button
        onClick={() => onDismiss(toast.id)}
        className="shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
        aria-label="Cerrar"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function Home() {
  const [amount, setAmount] = useState('')
  const [currency, setCurrency] = useState<Currency>('USD')
  const [paymentType, setPaymentType] = useState<PaymentType>('one_time')
  const [provider, setProvider] = useState<Provider>('tilopay')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = useCallback((t: Omit<Toast, 'id'>) => {
    const id = Date.now()
    setToasts((prev) => [...prev, { ...t, id }])
    setTimeout(() => setToasts((prev) => prev.filter((x) => x.id !== id)), 5000)
  }, [])

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((x) => x.id !== id))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const numericAmount = parseFloat(amount)
    if (!numericAmount || numericAmount <= 0) {
      addToast({ type: 'error', message: 'Ingresá un monto válido mayor a 0' })
      return
    }

    // TiloPay: Redirect to admin panel to create payment link manually
    if (provider === 'tilopay') {
      window.open('https://app.tilopay.com/admin/link-de-pago', '_blank')
      addToast({
        type: 'success',
        message: 'Abriendo panel de TiloPay para crear el link manualmente',
      })
      return
    }

    // ONVO flow (existing)
    const amountInCents = Math.round(numericAmount * 100)

    const baseUrl = window.location.origin
    const success_url = `${baseUrl}/checkout/success`
    const cancel_url = `${baseUrl}/checkout/cancel`

    setLoading(true)
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: amountInCents,
          currency,
          type: paymentType,
          provider,
          description: description.trim() || undefined,
          success_url,
          cancel_url,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error ?? 'Error generando el link')
      }

      // Copy to clipboard
      try {
        await navigator.clipboard.writeText(data.url)
        addToast({
          type: 'success',
          message: 'Link copiado al portapapeles',
          url: data.url,
        })
      } catch {
        // Clipboard permission denied — still show the link
        addToast({
          type: 'success',
          message: 'Link generado',
          url: data.url,
        })
      }
    } catch (err) {
      addToast({
        type: 'error',
        message: err instanceof Error ? err.message : 'Ocurrió un error inesperado',
      })
    } finally {
      setLoading(false)
    }
  }

  const currencySymbol = currency === 'USD' ? '$' : '₡'

  return (
    <>
      <LogoutButton />

      {/* Toast stack */}
      <div
        aria-live="polite"
        className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 items-center w-full px-4 pointer-events-none"
      >
        {toasts.map((t) => (
          <div key={t.id} className="pointer-events-auto w-full max-w-sm">
            <ToastItem toast={t} onDismiss={dismissToast} />
          </div>
        ))}
      </div>

      {/* Page */}
      <main className="min-h-screen flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-primary-600 mb-4 shadow-md">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Checkout Gen</h1>
            <p className="text-gray-500 text-sm mt-1">Generador de Links de Pago</p>
          </div>

          {/* Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <form onSubmit={handleSubmit} noValidate className="space-y-6">

              {/* Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Monto
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium select-none text-sm">
                    {currencySymbol}
                  </span>
                  <input
                    type="number"
                    inputMode="decimal"
                    placeholder="0.00"
                    min="0.01"
                    step="0.01"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    disabled={loading}
                    className={[
                      'w-full pl-8 pr-4 py-3 rounded-xl border border-gray-200',
                      'text-gray-900 placeholder-gray-400 text-base',
                      'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
                      'transition-shadow disabled:opacity-50 disabled:bg-gray-50',
                      '[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none',
                    ].join(' ')}
                  />
                </div>
              </div>

              {/* Toggles */}
              <div className="space-y-4">
                {/* Currency */}
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm font-medium text-gray-700 shrink-0">Moneda</span>
                  <Toggle
                    options={[
                      { value: 'USD' as Currency, label: 'USD' },
                      { value: 'CRC' as Currency, label: 'CRC' },
                    ]}
                    value={currency}
                    onChange={setCurrency}
                    disabled={loading}
                  />
                </div>

                {/* Payment type */}
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm font-medium text-gray-700 shrink-0">Tipo de pago</span>
                  <Toggle
                    options={[
                      { value: 'one_time' as PaymentType, label: 'Un pago' },
                      { value: 'recurring' as PaymentType, label: 'Recurrente' },
                    ]}
                    value={paymentType}
                    onChange={setPaymentType}
                    disabled={loading}
                  />
                </div>

                {/* Provider */}
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm font-medium text-gray-700 shrink-0">Proveedor</span>
                  <Toggle
                    options={[
                      { value: 'tilopay' as Provider, label: 'TiloPay' },
                      { value: 'onvo' as Provider, label: 'ONVO' },
                    ]}
                    value={provider}
                    onChange={setProvider}
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-gray-100" />

              {/* Description */}
              <div>
                <textarea
                  placeholder="Descripción (opcional)"
                  maxLength={200}
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={loading}
                  className={[
                    'w-full px-4 py-3 rounded-xl border border-gray-200 resize-none',
                    'text-gray-900 placeholder-gray-400 text-sm leading-relaxed',
                    'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
                    'transition-shadow disabled:opacity-50 disabled:bg-gray-50',
                  ].join(' ')}
                />
                <p className="mt-1 text-right text-xs text-gray-400">
                  {description.length}/200
                </p>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading || !amount}
                className={[
                  'w-full py-3.5 px-6 rounded-xl font-semibold text-white text-sm',
                  'bg-primary-600 hover:bg-primary-700 active:bg-primary-800',
                  'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
                  'transition-all duration-150',
                  'disabled:opacity-50 disabled:cursor-not-allowed',
                  'flex items-center justify-center gap-2',
                ].join(' ')}
              >
                {loading ? (
                  <>
                    <svg
                      className="w-4 h-4 animate-spin"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Generando…
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                    Generar Link
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Footer hint */}
          <p className="text-center text-xs text-gray-400 mt-6">
            El link se copiará automáticamente al portapapeles
          </p>
        </div>
      </main>
    </>
  )
}
