import { supabase } from '@/lib/supabase'
import { User } from '@/lib/supabase'

export interface AuthUser {
  id: string
  email: string
  created_at: string
}

export interface SignUpData {
  email: string
  password: string 
}

export interface SignInData {
  email: string
  password: string
}

export class AuthService {
  static async signUp(data: SignUpData): Promise<{ user: AuthUser | null; error: string | null }> {
    try {
      const { data: authData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
      })

      if (error) {
        return { user: null, error: error.message }
      }

      if (authData.user) {
        const user: AuthUser = {
          id: authData.user.id,
          email: authData.user.email!,
          created_at: authData.user.created_at,
        }
        return { user, error: null }
      }

      return { user: null, error: 'Sign up failed' }
    } catch (error) {
      return { user: null, error: 'An unexpected error occurred' }
    }
  }

  static async signIn(data: SignInData): Promise<{ user: AuthUser | null; error: string | null }> {
    try {
      const { data: authData, error } = await supabase.auth.signInWithPassword({
    email: data.email,
        password: data.password,
      })

      if (error) {
        return { user: null, error: error.message }
      }

      if (authData.user) {
        const user: AuthUser = {
          id: authData.user.id,
          email: authData.user.email!,
          created_at: authData.user.created_at,
        }
        return { user, error: null }
      }

      return { user: null, error: 'Sign in failed' }
    } catch (error) {
      return { user: null, error: 'An unexpected error occurred' }
    }
  }

  static async signInWithGoogle(): Promise<{ user: AuthUser | null; error: string | null }> {
    try {
      // Always use a full URL for redirectTo
      const redirectTo = window.location.origin + '/sessions';
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo
        }
      })

      if (error) {
        return { user: null, error: error.message }
      }

      // For OAuth, we don't get the user immediately - it will be handled by the auth state change
      return { user: null, error: null }
    } catch (error) {
      return { user: null, error: 'An unexpected error occurred' }
    }
  }

  static async signOut(): Promise<{ error: string | null }> {
    try {
      const { error } = await supabase.auth.signOut()
      return { error: error?.message || null }
    } catch (error) {
      return { error: 'An unexpected error occurred' }
    }
  }

  static async getCurrentUser(): Promise<{ user: AuthUser | null; error: string | null }> {
    try {
      const { data: { user }, error } = await supabase.auth.getUser()

      if (error) {
        return { user: null, error: error.message }
      }

      if (user) {
        const authUser: AuthUser = {
          id: user.id,
          email: user.email!,
          created_at: user.created_at,
        }
        return { user: authUser, error: null }
      }

      return { user: null, error: null }
    } catch (error) {
      return { user: null, error: 'An unexpected error occurred' }
    }
  }

  static onAuthStateChange(callback: (user: AuthUser | null) => void) {
    return supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const user: AuthUser = {
          id: session.user.id,
          email: session.user.email!,
          created_at: session.user.created_at,
        }
        callback(user)
      } else if (event === 'SIGNED_OUT') {
        callback(null)
      }
    })
  }
} 