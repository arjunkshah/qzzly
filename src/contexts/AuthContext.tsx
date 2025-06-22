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
  updateSubscription, 
  getCurrentUser 
} from '@/services/authService';

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

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      const success = await loginUser({ email, password });
      if (success) {
        const currentUser = getCurrentUser();
        setUser(currentUser);
      }
      return success;
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
      return success;
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

  const updateUserSubscription = async (plan: 'free' | 'pro', promoCode?: string): Promise<boolean> => {
    if (!user) return false;
    
    try {
      setIsLoading(true);
      const success = await updateSubscription(user.id, plan, promoCode);
      if (success) {
        const currentUser = getCurrentUser();
        setUser(currentUser);
      }
      return success;
    } catch (error) {
      console.error('Subscription update error:', error);
      return false;
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
    updateSubscription: updateUserSubscription,
    isLoading
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
