import React, { createContext, useContext, useEffect, useState } from 'react';
import { AuthService, AuthUser } from '@/services/authService';
import { SessionService } from '@/services/sessionService';

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signInWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  setGuestUser: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    const checkUser = async () => {
      if ((user as any)?.isGuest) return;
      try {
        const { user: foundUser, error } = await AuthService.getCurrentUser();
        if (error) {
          console.error('Auth error:', error);
        }
        if (!foundUser) {
          // No session, set guest user
          setUser({
            id: 'guest',
            email: 'guest@qzzly.com',
            created_at: new Date().toISOString(),
            isGuest: true,
            name: 'Guest User',
          } as any);
        } else {
          setUser(foundUser);
        }
      } catch (error) {
        console.error('Error checking user:', error);
      } finally {
        setLoading(false);
      }
    };

    checkUser();

    // Listen for auth state changes
    const { data: { subscription } } = AuthService.onAuthStateChange((user) => {
      setUser(user);
      setLoading(false);
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  useEffect(() => {
    SessionService.setCurrentUser(user);
  }, [user]);

  const signIn = async (email: string, password: string) => {
    try {
      const { user, error } = await AuthService.signIn({ email, password });
      if (error) {
        return { success: false, error };
      }
      return { success: true };
    } catch (error) {
      return { success: false, error: 'An unexpected error occurred' };
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      const { user, error } = await AuthService.signUp({ email, password });
      if (error) {
        return { success: false, error };
      }
      return { success: true };
    } catch (error) {
      return { success: false, error: 'An unexpected error occurred' };
    }
  };

  const signInWithGoogle = async () => {
    try {
      const { user, error } = await AuthService.signInWithGoogle();
      if (error) {
        return { success: false, error };
      }
      return { success: true };
    } catch (error) {
      return { success: false, error: 'An unexpected error occurred' };
    }
  };

  const signOut = async () => {
    try {
      await AuthService.signOut();
      setUser(null);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const setGuestUser = () => {
    setUser({
      id: 'guest',
      email: 'guest@qzzly.com',
      created_at: new Date().toISOString(),
      isGuest: true,
      name: 'Guest User',
    } as any);
  };

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
    setGuestUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
