export interface PaymentLink {
  id: string
  amount: number
  currency: string
  description: string
  reference: string
  expiresAt?: string
  createdAt: string
  status: 'active' | 'expired' | 'paid' | 'cancelled'
  url: string
}

export interface CreatePaymentLinkRequest {
  amount: number
  currency?: string
  description: string
  reference?: string
  expiresAt?: string
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}
