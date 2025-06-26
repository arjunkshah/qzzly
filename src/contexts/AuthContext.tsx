import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  AuthContextType, 
  User, 
  LoginFormData, 
  SignupFormData 
} from '@/types/user';
import { 
  loginUser, 
  signupUser, 
  logoutUser, 
  getCurrentUser 
} from '@/services/authService';
import { supabase } from '@/services/supabaseClient';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing user on mount
  useEffect(() => {
    const currentUser = getCurrentUser();
    setUser(currentUser);
    setIsLoading(false);
  }, []);

  // Listen for Supabase auth state changes (Google OAuth, etc.)
  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const supaUser = session.user;
        const newUser = {
          id: supaUser.id,
          email: supaUser.email,
          name: supaUser.user_metadata?.name || supaUser.email,
          subscription: {
            plan: 'free' as 'free',
            status: 'active' as 'active',
            startDate: new Date().toISOString(),
          },
          sessionCount: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setUser(newUser);
        localStorage.setItem('quiz_io_current_user', JSON.stringify(newUser));
      } else {
        setUser(null);
        localStorage.removeItem('quiz_io_current_user');
      }
    });
    return () => {
      listener?.subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
    setIsLoading(true);
      const success = await loginUser({ email, password });
      if (success) {
        const currentUser = getCurrentUser();
        setUser(currentUser);
      }
      return !!success;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (email: string, password: string, name: string): Promise<boolean> => {
    try {
    setIsLoading(true);
      const success = await signupUser({ email, password, name });
      if (success) {
        const currentUser = getCurrentUser();
        setUser(currentUser);
      }
      return !!success;
    } catch (error) {
      console.error('Signup error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    logoutUser();
    setUser(null);
  };

  // Google OAuth with Supabase
  const signInWithGoogle = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({ provider: 'google' });
      if (error) throw error;
    } catch (error) {
      console.error('Google sign-in error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const value: AuthContextType = {
      user, 
      isAuthenticated: !!user, 
      login, 
      signup, 
      logout, 
      isLoading,
      signInWithGoogle
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
