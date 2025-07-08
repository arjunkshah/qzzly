import { stripePromise } from '@/lib/stripe'
import { supabase } from '@/lib/supabase'
import { createCheckoutSession, createPortalSession, getSubscriptionStatus } from '@/api/stripe'

export interface CreateCheckoutSessionData {
  priceId: string
  successUrl: string
  cancelUrl: string
}

export interface CreatePortalSessionData {
  returnUrl: string
}

export class StripeService {
  static async createCheckoutSession(data: CreateCheckoutSessionData) {
    try {
      const user = await supabase.auth.getUser()
      if (!user.data.user) {
        throw new Error('User not authenticated')
      }

      const response = await createCheckoutSession({
        priceId: data.priceId,
        userId: user.data.user.id,
        successUrl: data.successUrl,
        cancelUrl: data.cancelUrl,
      })

      // For mock implementation, redirect to success URL
      window.location.href = response.url
    } catch (error) {
      console.error('Error creating checkout session:', error)
      throw error
    }
  }

  static async createPortalSession(data: CreatePortalSessionData) {
    try {
      const user = await supabase.auth.getUser()
      if (!user.data.user) {
        throw new Error('User not authenticated')
      }

      const response = await createPortalSession({
        userId: user.data.user.id,
        returnUrl: data.returnUrl,
      })

      window.location.href = response.url
    } catch (error) {
      console.error('Error creating portal session:', error)
      throw error
    }
  }

  static async getSubscriptionStatus() {
    try {
      const user = await supabase.auth.getUser()
      if (!user.data.user) {
        return { status: 'unauthenticated' }
      }

      const data = await getSubscriptionStatus(user.data.user.id)
      return data
    } catch (error) {
      console.error('Error getting subscription status:', error)
      return { status: 'error', error: error.message }
    }
  }
} 