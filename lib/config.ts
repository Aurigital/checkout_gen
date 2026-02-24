/**
 * Configuración centralizada de variables de entorno.
 * Valida que todas las variables requeridas estén presentes al importar.
 */

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function optionalEnv(key: string, fallback: string): string {
  return process.env[key] || fallback
}

// ---------------------------------------------------------------------------
// App
// ---------------------------------------------------------------------------

export const appConfig = {
  baseUrl: optionalEnv('NEXT_PUBLIC_BASE_URL', 'http://localhost:3000'),
  authPassword: process.env.AUTH_PASSWORD ?? '',
  isDev: process.env.NODE_ENV === 'development',
  isProd: process.env.NODE_ENV === 'production',
} as const

// ---------------------------------------------------------------------------
// TiloPay
// ---------------------------------------------------------------------------

export const tilopayConfig = {
  baseUrl: optionalEnv('TILOPAY_BASE_URL', 'https://api.tilopay.com/v1'),
  publicKey: process.env.NEXT_PUBLIC_TILOPAY_PUBLIC_KEY ?? '',
  secretKey: process.env.TILOPAY_SECRET_KEY ?? '',

  get successUrl() {
    return `${appConfig.baseUrl}/checkout/success`
  },
  get cancelUrl() {
    return `${appConfig.baseUrl}/checkout/cancel`
  },
} as const

// ---------------------------------------------------------------------------
// ONVO
// ---------------------------------------------------------------------------

export const onvoConfig = {
  publishableKey: process.env.NEXT_PUBLIC_ONVO_PUBLISHABLE_KEY ?? '',
  secretKey: process.env.ONVO_SECRET_KEY ?? '',
  baseUrl: 'https://api.onvopay.com/v1',

  get successUrl() {
    return `${appConfig.baseUrl}/checkout/success`
  },
  get cancelUrl() {
    return `${appConfig.baseUrl}/checkout/cancel`
  },

  get isTestMode() {
    return this.publishableKey.includes('_test_')
  },
  get isLiveMode() {
    return this.publishableKey.includes('_live_')
  },
} as const

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

export type PaymentProvider = 'tilopay' | 'onvo'

interface ValidationResult {
  isValid: boolean
  errors: string[]
}

export function validateTilopayConfig(): ValidationResult {
  const errors: string[] = []

  if (!tilopayConfig.publicKey) {
    errors.push('NEXT_PUBLIC_TILOPAY_PUBLIC_KEY is required')
  }
  if (!tilopayConfig.secretKey) {
    errors.push('TILOPAY_SECRET_KEY is required')
  }

  return { isValid: errors.length === 0, errors }
}

export function validateOnvoConfig(): ValidationResult {
  const errors: string[] = []

  if (!onvoConfig.publishableKey) {
    errors.push('NEXT_PUBLIC_ONVO_PUBLISHABLE_KEY is required')
  }
  if (!onvoConfig.secretKey) {
    errors.push('ONVO_SECRET_KEY is required')
  }

  // Both keys must be from the same environment (test vs live)
  if (onvoConfig.publishableKey && onvoConfig.secretKey) {
    const publishableIsTest = onvoConfig.publishableKey.includes('_test_')
    const secretIsTest = onvoConfig.secretKey.includes('_test_')
    if (publishableIsTest !== secretIsTest) {
      errors.push('ONVO keys must be from the same environment (both test or both live)')
    }
  }

  return { isValid: errors.length === 0, errors }
}

/**
 * Validates config for one or both providers.
 * Throws on first call in production if any required variable is missing.
 */
export function validateConfig(provider?: PaymentProvider): ValidationResult {
  const errors: string[] = []

  if (!provider || provider === 'tilopay') {
    errors.push(...validateTilopayConfig().errors)
  }
  if (!provider || provider === 'onvo') {
    errors.push(...validateOnvoConfig().errors)
  }

  return { isValid: errors.length === 0, errors }
}

/**
 * Asserts that config for the given provider is fully valid.
 * Throws a descriptive error listing every missing variable.
 */
export function assertConfig(provider?: PaymentProvider): void {
  const { isValid, errors } = validateConfig(provider)
  if (!isValid) {
    throw new Error(
      `Invalid configuration:\n${errors.map((e) => `  - ${e}`).join('\n')}\n` +
        `Check your .env.local file (see .env.example for reference).`
    )
  }
}

// ---------------------------------------------------------------------------
// Debug helper (dev only, never logs secrets)
// ---------------------------------------------------------------------------

export function logConfig(): void {
  if (!appConfig.isDev) return

  console.log('=== App Config ===')
  console.log('Base URL:', appConfig.baseUrl)
  console.log('Auth Password:', appConfig.authPassword ? '***set***' : 'NOT SET')
  console.log('')
  console.log('=== TiloPay Config ===')
  console.log('Public Key:', tilopayConfig.publicKey ? '***set***' : 'NOT SET')
  console.log('Secret Key:', tilopayConfig.secretKey ? '***set***' : 'NOT SET')
  console.log('Base URL:', tilopayConfig.baseUrl)
  console.log('')
  console.log('=== ONVO Config ===')
  console.log('Publishable Key:', onvoConfig.publishableKey ? '***set***' : 'NOT SET')
  console.log('Secret Key:', onvoConfig.secretKey ? '***set***' : 'NOT SET')
  console.log('Mode:', onvoConfig.isTestMode ? 'TEST' : onvoConfig.isLiveMode ? 'LIVE' : 'NOT SET')
}
