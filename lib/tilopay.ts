/**
 * TiloPay API client.
 *
 * TiloPay uses a redirect-based payment flow:
 *   1. Create a payment intent / subscription server-side.
 *   2. Redirect the user to the returned `url`.
 *   3. TiloPay redirects back to `success_url` or `cancel_url`.
 *
 * Amounts must be in centavos (e.g. $10.00 → 1000).
 */

import { tilopayConfig } from './config'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type TilopayCurrency = 'USD' | 'CRC'
export type TilopayInterval = 'month' | 'year'

export interface CreatePaymentIntentParams {
  /** Amount in centavos (e.g. $10.00 = 1000) */
  amount: number
  currency: TilopayCurrency
  description?: string
  success_url: string
  cancel_url: string
}

export interface CreateSubscriptionParams {
  /** Amount in centavos (e.g. $10.00 = 1000) */
  amount: number
  currency: TilopayCurrency
  description?: string
  interval: TilopayInterval
  success_url: string
  cancel_url: string
}

export interface TilopayRedirectResponse {
  /** Hosted checkout URL to redirect the user to */
  url: string
}

// Raw API error shape returned by TiloPay
interface TilopayApiError {
  message?: string
  error?: string
  code?: string | number
}

// ---------------------------------------------------------------------------
// Errors
// ---------------------------------------------------------------------------

export class TilopayError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
    public readonly code?: string | number
  ) {
    super(message)
    this.name = 'TilopayError'
  }
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

function validateAmount(amount: number): void {
  if (!Number.isInteger(amount) || amount <= 0) {
    throw new TilopayError(
      `amount must be a positive integer in centavos (received ${amount}). ` +
        'Example: $10.00 → 1000'
    )
  }
}

function validateCurrency(currency: string): asserts currency is TilopayCurrency {
  if (currency !== 'USD' && currency !== 'CRC') {
    throw new TilopayError(
      `currency must be "USD" or "CRC" (received "${currency}")`
    )
  }
}

function validateInterval(interval: string): asserts interval is TilopayInterval {
  if (interval !== 'month' && interval !== 'year') {
    throw new TilopayError(
      `interval must be "month" or "year" (received "${interval}")`
    )
  }
}

function validateUrl(value: string, field: string): void {
  if (!value || !value.startsWith('http')) {
    throw new TilopayError(`${field} must be a valid URL (received "${value}")`)
  }
}

// ---------------------------------------------------------------------------
// HTTP helper
// ---------------------------------------------------------------------------

async function request<T>(
  path: string,
  body: Record<string, unknown>
): Promise<T> {
  const secretKey = tilopayConfig.secretKey
  if (!secretKey) {
    throw new TilopayError('TILOPAY_SECRET_KEY is not configured')
  }

  const url = `${tilopayConfig.baseUrl}${path}`

  let response: Response
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })
  } catch (networkError) {
    throw new TilopayError(
      `Network error contacting TiloPay: ${(networkError as Error).message}`
    )
  }

  if (!response.ok) {
    let rawBody = ''
    let apiError: TilopayApiError = {}
    try {
      rawBody = await response.text()
      apiError = JSON.parse(rawBody)
    } catch {
      // ignore parse errors, use raw body or status text
    }
    const message =
      apiError.message ?? apiError.error ?? (rawBody || response.statusText) ?? 'Unknown error'
    console.error(
      `[tilopay] ${response.status} ${response.statusText} — URL: ${url}\nBody sent: ${JSON.stringify(body)}\nResponse: ${rawBody}`
    )
    throw new TilopayError(
      `TiloPay API error (${response.status}): ${message}`,
      response.status,
      apiError.code
    )
  }

  return response.json() as Promise<T>
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Creates a one-time payment intent and returns the hosted checkout URL.
 * Redirect the user to `url` to complete payment.
 */
export async function createPaymentIntent(
  params: CreatePaymentIntentParams
): Promise<TilopayRedirectResponse> {
  validateAmount(params.amount)
  validateCurrency(params.currency)
  validateUrl(params.success_url, 'success_url')
  validateUrl(params.cancel_url, 'cancel_url')

  return request<TilopayRedirectResponse>('/payment_intents', {
    amount: params.amount,
    currency: params.currency,
    ...(params.description && { description: params.description }),
    success_url: params.success_url,
    cancel_url: params.cancel_url,
  })
}

/**
 * Creates a recurring subscription and returns the hosted checkout URL.
 * Redirect the user to `url` to complete subscription setup.
 */
export async function createSubscription(
  params: CreateSubscriptionParams
): Promise<TilopayRedirectResponse> {
  validateAmount(params.amount)
  validateCurrency(params.currency)
  validateInterval(params.interval)
  validateUrl(params.success_url, 'success_url')
  validateUrl(params.cancel_url, 'cancel_url')

  return request<TilopayRedirectResponse>('/subscriptions', {
    amount: params.amount,
    currency: params.currency,
    interval: params.interval,
    ...(params.description && { description: params.description }),
    success_url: params.success_url,
    cancel_url: params.cancel_url,
  })
}
