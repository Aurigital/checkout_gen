# TiloPay Payment Gateway Implementation Guide

## Overview

This document provides a comprehensive guide for implementing TiloPay as a payment gateway in Next.js applications, specifically for ServidentalCR. TiloPay is a Costa Rican payment processor that supports local and international payment methods.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [TiloPay Configuration](#tilopay-configuration)
3. [Environment Variables](#environment-variables)
4. [API Client Implementation](#api-client-implementation)
5. [Payment Flow](#payment-flow)
6. [Frontend Components](#frontend-components)
7. [Backend API Routes](#backend-api-routes)
8. [Security Considerations](#security-considerations)
9. [Testing](#testing)
10. [Troubleshooting](#troubleshooting)

## Prerequisites

- Next.js 13+ with App Router
- TiloPay merchant account
- Costa Rican business registration (for local processing)
- HTTPS-enabled domain (required for production)

## TiloPay Configuration

### Account Setup

1. **Register with TiloPay**
   - Visit [TiloPay Developer Portal](https://tilopay.com/developers)
   - Complete merchant registration
   - Obtain API credentials

2. **API Credentials**
   - `TILOPAY_PUBLIC_KEY`: Client-side key for payment forms
   - `TILOPAY_SECRET_KEY`: Server-side key for API calls
   - `TILOPAY_WEBHOOK_SECRET`: For webhook validation
   - `TILOPAY_BASE_URL`: API endpoint (sandbox/production)

## Environment Variables

Create `.env.local` file with the following variables:

```bash
# TiloPay Configuration
NEXT_PUBLIC_TILOPAY_PUBLIC_KEY=pk_test_your_public_key_here
TILOPAY_SECRET_KEY=sk_test_your_secret_key_here
TILOPAY_WEBHOOK_SECRET=whsec_your_webhook_secret_here
TILOPAY_BASE_URL=https://api.tilopay.com/v1
NEXT_PUBLIC_TILOPAY_SANDBOX=true

# Application URLs
NEXT_PUBLIC_BASE_URL=https://yourdomain.com
TILOPAY_SUCCESS_URL=https://yourdomain.com/checkout/success
TILOPAY_CANCEL_URL=https://yourdomain.com/checkout/cancel
TILOPAY_WEBHOOK_URL=https://yourdomain.com/api/webhooks/tilopay
```

## API Client Implementation

### TiloPay Client Library

Create `src/lib/tilopay.ts`:

```typescript
import crypto from 'crypto';

export interface TiloPayPaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: string;
  client_secret: string;
  metadata?: Record<string, any>;
}

export interface TiloPayCustomer {
  name: string;
  email: string;
  phone?: string;
  address?: {
    line1: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
  };
}

export interface CreatePaymentIntentRequest {
  amount: number;
  currency: string;
  customer: TiloPayCustomer;
  metadata?: Record<string, any>;
  success_url: string;
  cancel_url: string;
  webhook_url?: string;
}

class TiloPayClient {
  private baseURL: string;
  private secretKey: string;

  constructor() {
    this.baseURL = process.env.TILOPAY_BASE_URL || 'https://api.tilopay.com/v1';
    this.secretKey = process.env.TILOPAY_SECRET_KEY || '';
  }

  private getAuthHeaders() {
    return {
      'Authorization': `Bearer ${this.secretKey}`,
      'Content-Type': 'application/json',
    };
  }

  async createPaymentIntent(data: CreatePaymentIntentRequest): Promise<TiloPayPaymentIntent> {
    const response = await fetch(`${this.baseURL}/payment_intents`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`TiloPay API Error: ${error.message || 'Unknown error'}`);
    }

    return response.json();
  }

  async retrievePaymentIntent(id: string): Promise<TiloPayPaymentIntent> {
    const response = await fetch(`${this.baseURL}/payment_intents/${id}`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`TiloPay API Error: ${error.message || 'Unknown error'}`);
    }

    return response.json();
  }

  async cancelPaymentIntent(id: string): Promise<TiloPayPaymentIntent> {
    const response = await fetch(`${this.baseURL}/payment_intents/${id}/cancel`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`TiloPay API Error: ${error.message || 'Unknown error'}`);
    }

    return response.json();
  }

  validateWebhookSignature(payload: string, signature: string): boolean {
    const webhookSecret = process.env.TILOPAY_WEBHOOK_SECRET;
    if (!webhookSecret) return false;

    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(payload, 'utf8')
      .digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
  }
}

export const tilopayClient = new TiloPayClient();
```

## Payment Flow

### 1. Payment Intent Creation

The payment flow starts when a customer initiates checkout:

```typescript
// src/app/api/tilopay/payment-intent/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { tilopayClient } from '@/lib/tilopay';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const { items, customer, metadata } = body;
    
    // Calculate total amount
    const amount = items.reduce((total: number, item: any) => {
      return total + (item.price * item.quantity);
    }, 0);

    const paymentIntent = await tilopayClient.createPaymentIntent({
      amount: Math.round(amount * 100), // Convert to cents
      currency: 'CRC', // Costa Rican Colón
      customer,
      metadata: {
        order_id: metadata?.order_id,
        cart_items: JSON.stringify(items),
        ...metadata
      },
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/checkout/success?payment_intent={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/checkout/cancel`,
      webhook_url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/webhooks/tilopay`,
    });

    return NextResponse.json({
      client_secret: paymentIntent.client_secret,
      payment_intent_id: paymentIntent.id,
    });

  } catch (error) {
    console.error('TiloPay payment intent creation failed:', error);
    return NextResponse.json(
      { error: 'Failed to create payment intent' },
      { status: 500 }
    );
  }
}
```

### 2. Frontend Payment Component

```typescript
// src/components/checkout/TiloPayCheckout.tsx
'use client';

import { useState } from 'react';
import { useCart } from '@/hooks/useCart';

interface TiloPayCheckoutProps {
  customer: {
    name: string;
    email: string;
    phone?: string;
  };
}

export function TiloPayCheckout({ customer }: TiloPayCheckoutProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { items, total, clearCart } = useCart();

  const handlePayment = async () => {
    setLoading(true);
    setError(null);

    try {
      // Create payment intent
      const response = await fetch('/api/tilopay/payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items,
          customer,
          metadata: {
            order_id: `ORD-${Date.now()}`,
            total_items: items.length,
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create payment intent');
      }

      const { client_secret, payment_intent_id } = await response.json();

      // Redirect to TiloPay hosted checkout
      const tilopayUrl = `https://checkout.tilopay.com/pay/${client_secret}`;
      
      // Store payment intent for later verification
      sessionStorage.setItem('tilopay_payment_intent', payment_intent_id);
      
      // Redirect to TiloPay
      window.location.href = tilopayUrl;

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="font-medium mb-2">Resumen del Pedido</h3>
        <div className="space-y-2">
          {items.map((item) => (
            <div key={item.id} className="flex justify-between text-sm">
              <span>{item.name} x {item.quantity}</span>
              <span>₡{(item.price * item.quantity).toLocaleString()}</span>
            </div>
          ))}
          <div className="border-t pt-2 font-medium">
            <div className="flex justify-between">
              <span>Total:</span>
              <span>₡{total.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <button
        onClick={handlePayment}
        disabled={loading || items.length === 0}
        className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Procesando...' : `Pagar ₡${total.toLocaleString()}`}
      </button>

      <div className="text-xs text-gray-500 text-center">
        Procesado de forma segura por TiloPay
      </div>
    </div>
  );
}
```

## Backend API Routes

### Webhook Handler

```typescript
// src/app/api/webhooks/tilopay/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { tilopayClient } from '@/lib/tilopay';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('tilopay-signature');

    if (!signature || !tilopayClient.validateWebhookSignature(body, signature)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const event = JSON.parse(body);

    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSuccess(event.data.object);
        break;
      
      case 'payment_intent.failed':
        await handlePaymentFailure(event.data.object);
        break;
      
      case 'payment_intent.canceled':
        await handlePaymentCancellation(event.data.object);
        break;
      
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}

async function handlePaymentSuccess(paymentIntent: any) {
  // Process successful payment
  console.log('Payment succeeded:', paymentIntent.id);
  
  // Update order status in database
  // Send confirmation email
  // Clear cart
  // Log transaction
}

async function handlePaymentFailure(paymentIntent: any) {
  // Handle failed payment
  console.log('Payment failed:', paymentIntent.id);
  
  // Log failure reason
  // Notify customer if needed
}

async function handlePaymentCancellation(paymentIntent: any) {
  // Handle canceled payment
  console.log('Payment canceled:', paymentIntent.id);
  
  // Update order status
  // Restore inventory if reserved
}
```

### Success Page Handler

```typescript
// src/app/checkout/success/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useCart } from '@/hooks/useCart';

export default function CheckoutSuccessPage() {
  const [loading, setLoading] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState<'success' | 'failed' | null>(null);
  const searchParams = useSearchParams();
  const { clearCart } = useCart();

  useEffect(() => {
    const verifyPayment = async () => {
      const paymentIntentId = searchParams.get('payment_intent');
      
      if (!paymentIntentId) {
        setPaymentStatus('failed');
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/tilopay/verify-payment?payment_intent=${paymentIntentId}`);
        const result = await response.json();

        if (result.status === 'succeeded') {
          setPaymentStatus('success');
          clearCart();
        } else {
          setPaymentStatus('failed');
        }
      } catch (error) {
        console.error('Payment verification failed:', error);
        setPaymentStatus('failed');
      } finally {
        setLoading(false);
      }
    };

    verifyPayment();
  }, [searchParams, clearCart]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Verificando pago...</p>
        </div>
      </div>
    );
  }

  if (paymentStatus === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">¡Pago Exitoso!</h1>
          <p className="text-gray-600 mb-6">
            Tu pedido ha sido procesado correctamente. Recibirás un email de confirmación pronto.
          </p>
          <a
            href="/"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700"
          >
            Volver al Inicio
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Pago Fallido</h1>
        <p className="text-gray-600 mb-6">
          Hubo un problema procesando tu pago. Por favor intenta nuevamente.
        </p>
        <a
          href="/checkout"
          className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700"
        >
          Intentar Nuevamente
        </a>
      </div>
    </div>
  );
}
```

## Security Considerations

### 1. API Key Security
- Never expose secret keys in client-side code
- Use environment variables for all sensitive data
- Rotate keys regularly

### 2. Webhook Security
- Always validate webhook signatures
- Use HTTPS for webhook endpoints
- Implement idempotency for webhook handlers

### 3. Payment Verification
- Always verify payment status server-side
- Don't trust client-side payment confirmations
- Implement proper error handling

## Testing

### Test Cards for Sandbox

TiloPay provides test cards for sandbox testing:

```javascript
// Test card numbers for different scenarios
const testCards = {
  success: '4111111111111111',
  declined: '4000000000000002',
  insufficientFunds: '4000000000009995',
  expiredCard: '4000000000000069',
};
```

### Testing Checklist

- [ ] Payment intent creation
- [ ] Successful payment flow
- [ ] Failed payment handling
- [ ] Webhook processing
- [ ] Success/cancel page redirects
- [ ] Cart clearing after successful payment
- [ ] Error message display
- [ ] Mobile responsiveness

## Troubleshooting

### Common Issues

1. **Invalid API Keys**
   - Verify environment variables are set correctly
   - Check if using sandbox vs production keys appropriately

2. **Webhook Not Receiving Events**
   - Ensure webhook URL is publicly accessible
   - Verify HTTPS is enabled
   - Check firewall settings

3. **Payment Intent Creation Fails**
   - Validate request payload format
   - Check amount is in correct format (cents)
   - Verify customer data is complete

4. **Signature Validation Fails**
   - Ensure webhook secret is correct
   - Check payload is being read as raw text
   - Verify signature calculation method

### Debug Mode

Enable debug logging in development:

```typescript
// Add to your tilopay client
private debug = process.env.NODE_ENV === 'development';

private log(message: string, data?: any) {
  if (this.debug) {
    console.log(`[TiloPay] ${message}`, data);
  }
}
```

## Production Deployment

### Pre-deployment Checklist

- [ ] Update to production API keys
- [ ] Set `NEXT_PUBLIC_TILOPAY_SANDBOX=false`
- [ ] Configure production webhook URL
- [ ] Test payment flow in production
- [ ] Set up monitoring and alerts
- [ ] Implement proper logging

### Monitoring

Implement monitoring for:
- Payment success/failure rates
- Webhook processing errors
- API response times
- Failed payment attempts

---

## Support

For TiloPay-specific issues:
- [TiloPay Documentation](https://docs.tilopay.com)
- [TiloPay Support](https://support.tilopay.com)

For implementation questions:
- Check this documentation
- Review the codebase examples
- Test in sandbox environment first

---

*Last updated: September 2024*
*Version: 1.0*