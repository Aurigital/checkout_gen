import { NextRequest, NextResponse } from 'next/server'
import { createPaymentIntent as tilopayPayment, createSubscription as tilopaySubscription } from '@/lib/tilopay'
import { createPaymentIntent as onvoPayment, createSubscription as onvoSubscription } from '@/lib/onvo'

export async function POST(request: NextRequest) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { amount, currency, type, provider, description, success_url, cancel_url } = body as {
    amount: number
    currency: 'USD' | 'CRC'
    type: 'one_time' | 'recurring'
    provider: 'tilopay' | 'onvo'
    description?: string
    success_url: string
    cancel_url: string
  }

  if (!amount || !currency || !type || !provider || !success_url || !cancel_url) {
    return NextResponse.json(
      { error: 'Missing required fields: amount, currency, type, provider, success_url, cancel_url' },
      { status: 400 }
    )
  }

  try {
    let result: { url: string }

    if (provider === 'tilopay') {
      if (type === 'recurring') {
        result = await tilopaySubscription({
          amount,
          currency,
          description,
          interval: 'month',
          success_url,
          cancel_url,
        })
      } else {
        result = await tilopayPayment({
          amount,
          currency,
          description,
          success_url,
          cancel_url,
        })
      }
    } else {
      if (type === 'recurring') {
        result = await onvoSubscription({
          amount,
          currency,
          description,
          interval: 'month',
          success_url,
          cancel_url,
        })
      } else {
        result = await onvoPayment({
          amount,
          currency,
          description,
          success_url,
          cancel_url,
        })
      }
    }

    return NextResponse.json({ url: result.url })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('[generate] Error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
