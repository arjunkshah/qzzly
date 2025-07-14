import React, { createContext, useContext, useState } from 'react';

interface AuthUser {
  id: string;
  email: string;
  name?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signInWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(false);



  const signIn = async (email: string, password: string) => {
    // Mock sign in - always succeeds
    const mockUser: AuthUser = {
      id: 'mock-user-id',
      email: email,
      name: email.split('@')[0]
    };
    setUser(mockUser);
      return { success: true };
  };

  const signUp = async (email: string, password: string) => {
    // Mock sign up - always succeeds
    const mockUser: AuthUser = {
      id: 'mock-user-id',
      email: email,
      name: email.split('@')[0]
    };
    setUser(mockUser);
      return { success: true };
  };

  const signInWithGoogle = async () => {
    // Mock Google sign in - always succeeds
    const mockUser: AuthUser = {
      id: 'mock-google-user-id',
      email: 'user@gmail.com',
      name: 'Google User'
    };
    setUser(mockUser);
      return { success: true };
  };

  const signOut = async () => {
      setUser(null);
  };

  const value = {
    user,
    isLoading,
    isAuthenticated: !!user,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
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
