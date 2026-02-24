import { NextRequest, NextResponse } from 'next/server'
import { createPaymentIntent, createSubscription, TilopayError } from '@/lib/tilopay'
import { appConfig } from '@/lib/config'

// ---------------------------------------------------------------------------
// Request / Response types
// ---------------------------------------------------------------------------

interface CreateLinkRequestBody {
  amount: number
  currency: 'USD' | 'CRC'
  description?: string
  isRecurring: boolean
}

type SuccessResponse = { success: true; url: string }
type ErrorResponse = { success: false; error: string }
type ApiResponse = SuccessResponse | ErrorResponse

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

function validateBody(raw: unknown): CreateLinkRequestBody {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    throw new Error('Request body must be a JSON object')
  }

  const body = raw as Record<string, unknown>

  if (typeof body.amount !== 'number' || !isFinite(body.amount) || body.amount <= 0) {
    throw new Error('amount must be a positive number')
  }

  if (body.currency !== 'USD' && body.currency !== 'CRC') {
    throw new Error('currency must be "USD" or "CRC"')
  }

  if (typeof body.isRecurring !== 'boolean') {
    throw new Error('isRecurring must be a boolean')
  }

  if (body.description !== undefined && typeof body.description !== 'string') {
    throw new Error('description must be a string')
  }

  return {
    amount: body.amount,
    currency: body.currency,
    description: typeof body.description === 'string' ? body.description.trim() || undefined : undefined,
    isRecurring: body.isRecurring,
  }
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse>> {
  // Parse body
  let rawBody: unknown
  try {
    rawBody = await request.json()
  } catch {
    return NextResponse.json(
      { success: false, error: 'Invalid JSON body' },
      { status: 400 }
    )
  }

  // Validate fields
  let body: CreateLinkRequestBody
  try {
    body = validateBody(rawBody)
  } catch (err) {
    return NextResponse.json(
      { success: false, error: (err as Error).message },
      { status: 400 }
    )
  }

  // Convert amount to centavos
  const amountInCents = Math.round(body.amount * 100)

  // Build redirect URLs
  const base = appConfig.baseUrl
  const success_url = `${base}/success?provider=tilopay`
  const cancel_url = `${base}/cancel?provider=tilopay`

  // Call TiloPay client
  try {
    const result = body.isRecurring
      ? await createSubscription({
          amount: amountInCents,
          currency: body.currency,
          description: body.description,
          interval: 'month',
          success_url,
          cancel_url,
        })
      : await createPaymentIntent({
          amount: amountInCents,
          currency: body.currency,
          description: body.description,
          success_url,
          cancel_url,
        })

    return NextResponse.json({ success: true, url: result.url })
  } catch (err) {
    const message =
      err instanceof TilopayError
        ? err.message
        : err instanceof Error
          ? err.message
          : 'Unexpected error'

    console.error('[tilopay/create-link]', message)

    // Surface config/validation errors as 400, API/network errors as 502
    const status = err instanceof TilopayError && err.statusCode ? 502 : 500
    return NextResponse.json({ success: false, error: message }, { status })
  }
}
