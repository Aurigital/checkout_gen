/**
 * ONVO API client.
 *
 * ONVO uses a redirect-based payment flow via Checkout Sessions:
 *   1. Create the necessary resources server-side (payment intent / subscription).
 *   2. Create a Checkout Session that returns a hosted `url`.
 *   3. Redirect the user to that `url`.
 *   4. ONVO redirects back to `redirectUrl` (success) or `cancelUrl`.
 *
 * Amounts must be in centavos/céntimos:
 *   USD: $10.00 → 1000
 *   CRC: ₡2,100.89 → 210089
 *
 * API base: https://api.onvopay.com/v1
 * Auth: Bearer <ONVO_SECRET_KEY>
 */

import { onvoConfig } from './config'

// ---------------------------------------------------------------------------
// Shared types
// ---------------------------------------------------------------------------

export type OnvoCurrency = 'USD' | 'CRC'
export type OnvoInterval = 'month' | 'year'

export interface CreatePaymentIntentParams {
  /** Amount in centavos/céntimos (e.g. $10.00 = 1000) */
  amount: number
  currency: OnvoCurrency
  description?: string
  success_url: string
  cancel_url: string
}

export interface CreateSubscriptionParams {
  /** Amount in centavos/céntimos (e.g. $10.00 = 1000) */
  amount: number
  currency: OnvoCurrency
  description?: string
  interval: OnvoInterval
  success_url: string
  cancel_url: string
}

export interface OnvoRedirectResponse {
  /** Hosted checkout URL to redirect the user to */
  url: string
}

// ---------------------------------------------------------------------------
// Internal API response types
// ---------------------------------------------------------------------------

interface OnvoPaymentIntent {
  id: string
  amount: number
  currency: string
  status: string
}

interface OnvoCustomer {
  id: string
}

interface OnvoProduct {
  id: string
}

interface OnvoPrice {
  id: string
}

interface OnvoSubscription {
  id: string
}

interface OnvoCheckoutSession {
  id: string
  url: string
}

// Raw API error shape
interface OnvoApiError {
  statusCode?: number
  apiCode?: string
  message?: string | string[]
  error?: string
}

// ---------------------------------------------------------------------------
// Error class
// ---------------------------------------------------------------------------

export class OnvoError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
    public readonly apiCode?: string
  ) {
    super(message)
    this.name = 'OnvoError'
  }
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

function validateAmount(amount: number): void {
  if (!Number.isInteger(amount) || amount <= 0) {
    throw new OnvoError(
      `amount must be a positive integer in centavos (received ${amount}). ` +
        'Example: $10.00 → 1000'
    )
  }
}

function validateCurrency(currency: string): asserts currency is OnvoCurrency {
  if (currency !== 'USD' && currency !== 'CRC') {
    throw new OnvoError(
      `currency must be "USD" or "CRC" (received "${currency}")`
    )
  }
}

function validateInterval(interval: string): asserts interval is OnvoInterval {
  if (interval !== 'month' && interval !== 'year') {
    throw new OnvoError(
      `interval must be "month" or "year" (received "${interval}")`
    )
  }
}

function validateUrl(value: string, field: string): void {
  if (!value || !value.startsWith('http')) {
    throw new OnvoError(`${field} must be a valid URL (received "${value}")`)
  }
}

// ---------------------------------------------------------------------------
// HTTP helper
// ---------------------------------------------------------------------------

async function request<T>(
  method: 'GET' | 'POST',
  path: string,
  body?: Record<string, unknown>
): Promise<T> {
  const secretKey = onvoConfig.secretKey
  if (!secretKey) {
    throw new OnvoError('ONVO_SECRET_KEY is not configured')
  }

  const url = `${onvoConfig.baseUrl}${path}`

  let response: Response
  try {
    response = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
      ...(body !== undefined && { body: JSON.stringify(body) }),
    })
  } catch (networkError) {
    throw new OnvoError(
      `Network error contacting ONVO: ${(networkError as Error).message}`
    )
  }

  if (!response.ok) {
    let apiError: OnvoApiError = {}
    try {
      apiError = await response.json()
    } catch {
      // ignore parse errors
    }
    const rawMessage = apiError.message
    const message = Array.isArray(rawMessage)
      ? rawMessage.join('; ')
      : (rawMessage ?? apiError.error ?? response.statusText ?? 'Unknown error')
    throw new OnvoError(
      `ONVO API error (${response.status}): ${message}`,
      response.status,
      apiError.apiCode
    )
  }

  return response.json() as Promise<T>
}

// ---------------------------------------------------------------------------
// Internal API calls
// ---------------------------------------------------------------------------

function createPaymentIntentRequest(
  amount: number,
  currency: OnvoCurrency,
  description?: string
): Promise<OnvoPaymentIntent> {
  return request<OnvoPaymentIntent>('POST', '/payment-intents', {
    amount,
    currency,
    captureMethod: 'automatic',
    ...(description && { description }),
  })
}

function createCustomer(): Promise<OnvoCustomer> {
  return request<OnvoCustomer>('POST', '/customers', {})
}

function createProduct(description?: string): Promise<OnvoProduct> {
  return request<OnvoProduct>('POST', '/products', {
    name: description ?? 'Subscription',
    isActive: true,
    isShippable: false,
  })
}

function createPrice(
  productId: string,
  amount: number,
  currency: OnvoCurrency,
  interval: OnvoInterval
): Promise<OnvoPrice> {
  return request<OnvoPrice>('POST', '/prices', {
    productId,
    unitAmount: amount,
    currency,
    isActive: true,
    type: 'recurring',
    recurring: {
      interval,
      intervalCount: 1,
    },
  })
}

function createSubscriptionRequest(
  customerId: string,
  priceId: string
): Promise<OnvoSubscription> {
  return request<OnvoSubscription>('POST', '/subscriptions', {
    customerId,
    paymentBehavior: 'allow_incomplete',
    items: [{ priceId, quantity: 1 }],
  })
}

function createCheckoutSession(params: {
  lineItems: Array<{ priceId: string; quantity: number }>
  redirectUrl: string
  cancelUrl: string
}): Promise<OnvoCheckoutSession> {
  return request<OnvoCheckoutSession>('POST', '/checkout/sessions/one-time-link', {
    lineItems: params.lineItems,
    redirectUrl: params.redirectUrl,
    cancelUrl: params.cancelUrl,
  })
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Creates a one-time payment and returns the hosted checkout URL.
 *
 * Steps:
 *   1. Create a payment intent.
 *   2. Create a checkout session linked to that payment intent via a price.
 *   3. Return `{ url }` to redirect the user to.
 */
export async function createPaymentIntent(
  params: CreatePaymentIntentParams
): Promise<OnvoRedirectResponse> {
  validateAmount(params.amount)
  validateCurrency(params.currency)
  validateUrl(params.success_url, 'success_url')
  validateUrl(params.cancel_url, 'cancel_url')

  // Step 1: Create a product to attach the price to
  const product = await createProduct(params.description)

  // Step 2: Create a one-time price for this product
  const price = await request<OnvoPrice>('POST', '/prices', {
    productId: product.id,
    unitAmount: params.amount,
    currency: params.currency,
    isActive: true,
    type: 'one_time',
  })

  // Step 3: Create payment intent
  await createPaymentIntentRequest(params.amount, params.currency, params.description)

  // Step 4: Create a checkout session with the price
  const session = await createCheckoutSession({
    lineItems: [{ priceId: price.id, quantity: 1 }],
    redirectUrl: params.success_url,
    cancelUrl: params.cancel_url,
  })

  return { url: session.url }
}

/**
 * Creates a recurring subscription and returns the hosted checkout URL.
 *
 * Steps:
 *   1. Create a customer.
 *   2. Create a product and recurring price.
 *   3. Create a subscription (allow_incomplete) for that customer + price.
 *   4. Create a checkout session.
 *   5. Return `{ url }` to redirect the user to.
 */
export async function createSubscription(
  params: CreateSubscriptionParams
): Promise<OnvoRedirectResponse> {
  validateAmount(params.amount)
  validateCurrency(params.currency)
  validateInterval(params.interval)
  validateUrl(params.success_url, 'success_url')
  validateUrl(params.cancel_url, 'cancel_url')

  // Step 1: Create a customer
  const customer = await createCustomer()

  // Step 2: Create a product for this subscription
  const product = await createProduct(params.description)

  // Step 3: Create a recurring price
  const price = await createPrice(
    product.id,
    params.amount,
    params.currency,
    params.interval
  )

  // Step 4: Create the subscription (payment deferred until checkout)
  await createSubscriptionRequest(customer.id, price.id)

  // Step 5: Create a checkout session with the recurring price
  const session = await createCheckoutSession({
    lineItems: [{ priceId: price.id, quantity: 1 }],
    redirectUrl: params.success_url,
    cancelUrl: params.cancel_url,
  })

  return { url: session.url }
}
