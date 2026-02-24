# TiloPay Integration Research

## Status: PENDING - API Documentation Incomplete

## Problem Summary

The current implementation in `/lib/tilopay.ts` is **non-functional** due to incorrect assumptions about TiloPay's API architecture.

### Initial Assumptions (WRONG)
- ❌ TiloPay has a hosted checkout API like Stripe/ONVO
- ❌ Can generate payment links server-side with `createPaymentIntent()`
- ❌ API base URL is `https://api.tilopay.com/v1` (DNS doesn't exist)
- ❌ Authentication is Bearer token with `TILOPAY_SECRET_KEY` directly

### Actual Reality (CONFIRMED)
- ✅ TiloPay API requires **full card data** (PAN, CVV, expiry) for server-to-server processing
- ✅ Real base URL: `https://app.tilopay.com/api/v1`
- ✅ Authentication is **two-step**:
  1. POST `/api/v1/login` with `{ apiuser, password }` → get Bearer token
  2. Use that token for subsequent requests
- ✅ API returns a `urlRedirect` for 3DS challenges, NOT a hosted checkout

## Official TiloPay Credentials

From admin panel (Integración con plataformas):

```
Llave Api (API Key):       1206-6665-8400-2625-9049
Usuario Api (API User):    LkMQ7S
Contraseña Api (Password): ftvD82
```

**Mapping to env vars:**
- `NEXT_PUBLIC_TILOPAY_PUBLIC_KEY` = Llave Api (1206-6665-8400-2625-9049)
- `TILOPAY_API_USER` = Usuario Api (LkMQ7S) — **MISSING from .env**
- `TILOPAY_SECRET_KEY` = Contraseña Api (ftvD82)

## Verified API Endpoints

### 1. Authentication (LOGIN)
```http
POST https://app.tilopay.com/api/v1/login
Content-Type: application/json

{
  "apiuser": "LkMQ7S",
  "password": "ftvD82"
}
```

**Response:**
```json
{
  "access_token": "eyJ0eXAiOi...",
  "token_type": "bearer",
  "expires_in": 86400
}
```

### 2. Server-to-Server Payment Processing
```http
POST [merchant-specific URL provided by TiloPay]
Authorization: bearer {token from login}
tx-proxy-key: [provided by tilopay]
Content-Type: application/json

{
  "key": "1206-6665-8400-2625-9049",
  "card": "4111111111111111",
  "cvv": "123",
  "expire": "1225",
  "name": "John",
  "lastname": "Doe",
  "email": "john@example.com",
  "phone": "88888888",
  "address": "123 Main St",
  "city": "San Jose",
  "state": "CR-SJ",
  "zipcode": "10101",
  "country": "CR",
  "shipToFirstName": "John",
  "shipToLastName": "Doe",
  "shipToAddress": "123 Main St",
  "shipToAddress2": "",
  "shipToCity": "San Jose",
  "shipToState": "SJ",
  "shipToZipPostCode": "10101",
  "shipToCountry": "CR",
  "shipToTelephone": "88888888",
  "amount": "100.00",
  "currency": "USD",
  "orderNumber": "ORDER-12345",
  "capture": 1,
  "redirect": "https://yoursite.com/callback"
}
```

**Response:**
```json
{
  "code": "",
  "description": "",
  "auth": "",
  "orderNumber": "ORDER-12345",
  "urlRedirect": "https://secure.tilopay.com/htmls/1026345966.html",
  "error": ""
}
```

## Architecture Incompatibility

**Problem:** TiloPay's server-to-server API requires full card details upfront. This means:

1. **Cannot generate a "payment link"** without card data
2. **Current app flow is incompatible**:
   - Current: User enters amount → Generate URL → Redirect user → User enters card on hosted page
   - TiloPay: User enters card data → Process server-side → Redirect to 3DS challenge

## Payment Links Feature (Admin UI)

TiloPay DOES have a "Link de pago abierto" feature visible in the admin panel:
- Location: Sidebar → "Link de pago & Código QR"
- Generates shareable links like `https://tp.cr/s/MTExODk1`
- These redirect to `https://securepayment.tilopay.com/static-payment?paymentCode=MTExODk1`

**PROBLEM:** This feature is **admin-UI-only**. No documented API endpoint exists to create these links programmatically.

## Investigated Solutions

### Option 1: TiloPay SDK (Client-Side) ⚠️
- **Status:** Documentation incomplete
- **Concept:** JavaScript SDK renders card form on your page
- **Pros:** PCI compliant, no server-side card handling
- **Cons:** No clear API docs found, unclear if supports dynamic amounts
- **SDK Docs:** https://tilopay.com/documentacion/sdk (does not cover link generation)

### Option 2: Server-to-Server with Test Cards ⚠️
- **Status:** Technically possible but NOT production-ready
- **Implementation:** Use the documented API with hardcoded test card numbers
- **Pros:** Works for testing
- **Cons:** Violates PCI compliance, cannot process real payments

### Option 3: Payment Links API 🔍 UNKNOWN
- **Status:** Unconfirmed
- **Hypothesis:** TiloPay may have an undocumented endpoint to create payment links
- **Next step:** Contact TiloPay support to ask

## Recommended Actions

1. **Contact TiloPay Support:**
   - Email: sac@tilopay.com / soporte@tilopay.com
   - Ask: "¿Existe un endpoint API para crear 'Links de pago abierto' programáticamente?"
   - Request: Full API documentation for payment link generation

2. **Short-term workaround:**
   - Disable TiloPay option in frontend
   - Use only ONVO (which works correctly)
   - Add back TiloPay once proper API is confirmed

3. **If API exists:**
   - Rewrite `/lib/tilopay.ts` with correct endpoint
   - Update env vars to include `TILOPAY_API_USER`
   - Test with sandbox credentials

## Current Code Status

### Files Affected
- `/lib/tilopay.ts` — needs complete rewrite once API is confirmed
- `/app/api/generate/route.ts` — TiloPay branch will fail
- `/app/api/tilopay/create-link/route.ts` — unused, can be deleted

### Environment Variables Needed
```env
TILOPAY_BASE_URL=https://app.tilopay.com/api/v1
NEXT_PUBLIC_TILOPAY_PUBLIC_KEY=1206-6665-8400-2625-9049
TILOPAY_API_USER=LkMQ7S  # ← MISSING, needs to be added
TILOPAY_SECRET_KEY=ftvD82
```

## Resources

- **Postman Docs:** https://documenter.getpostman.com/view/12758640/TVKA5KUT
- **SDK Docs:** https://tilopay.com/documentacion/sdk
- **TiloPay Website:** https://tilopay.com/documentacion
- **Admin Panel:** https://admin.tilopay.com/

## Last Updated
2026-02-24

---

**Conclusion:** TiloPay integration is **blocked** pending clarification on payment links API availability. Current implementation is non-functional and should be disabled in production.
