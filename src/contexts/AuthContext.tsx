import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  AuthContextType,
  User,
} from '@/types/user';
import {
  loginUser,
  signupUser,
  logoutUser,
  getCurrentUser,
  signInWithGoogle,
} from '@/services/authService';
import { supabase } from '@/services/supabaseClient';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        const currentUser = getCurrentUser();
        if (!currentUser) {
          const mapped = {
            id: data.user.id,
            email: data.user.email || '',
            name: data.user.user_metadata?.name || data.user.email || '',
            subscription: data.user.user_metadata?.subscription || { plan: 'free', status: 'active', startDate: data.user.created_at },
            sessionCount: data.user.user_metadata?.sessionCount || 0,
            createdAt: data.user.created_at,
            updatedAt: data.user.updated_at || data.user.created_at,
          } as User;
          localStorage.setItem('quiz_io_current_user', JSON.stringify(mapped));
          setUser(mapped);
        } else {
          setUser(currentUser);
        }
      }
      setIsLoading(false);
    };

    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      const currentUser = getCurrentUser();
      setUser(currentUser);
    });

    loadUser();
    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      const u = await loginUser({ email, password });
      setUser(u);
      return true;
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
      const u = await signupUser({ email, password, name });
      setUser(u);
      return true;
    } catch (error) {
      console.error('Signup error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const googleSignIn = async () => {
    try {
      setIsLoading(true);
      await signInWithGoogle();
    } catch (error) {
      console.error('Google sign-in error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    await logoutUser();
    setUser(null);
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    login,
    signup,
    logout,
    isLoading,
    signInWithGoogle: googleSignIn,
  } as AuthContextType;

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
