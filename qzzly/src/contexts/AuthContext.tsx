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

  // Mock Google OAuth
  const signInWithGoogle = async () => {
    setIsLoading(true);
    try {
      // Simulate Google OAuth
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockUser = {
        id: `google_user_${Date.now()}`,
        email: 'demo@example.com',
        name: 'Demo User',
        subscription: {
          plan: 'free' as 'free',
          status: 'active' as 'active',
          startDate: new Date().toISOString(),
        },
        sessionCount: 0,
        createdat: new Date().toISOString(),
        updatedat: new Date().toISOString(),
        usage: {
          monthlySessions: 0,
          monthlyFiles: 0,
          currentMonth: new Date().toISOString().slice(0, 7), // YYYY-MM
          lastResetDate: new Date().toISOString(),
        },
      };
      
      setUser(mockUser);
      localStorage.setItem('quiz_io_current_user', JSON.stringify(mockUser));
    } catch (error) {
      console.error('Google sign-in error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Mock subscription update
  const updateSubscription = async (plan: 'pro', promoCode?: string): Promise<boolean> => {
    if (!user) return false;
    
    if (promoCode && promoCode.trim().toUpperCase() === 'BETAX') {
      // Mock upgrade with promo code
      const updatedUser = {
        ...user,
        subscription: {
          ...user.subscription,
          plan: 'pro',
          status: 'active',
          startDate: new Date().toISOString(),
        },
        updatedat: new Date().toISOString(),
      };
      
      setUser(updatedUser);
      localStorage.setItem('quiz_io_current_user', JSON.stringify(updatedUser));
      return true;
    } else {
      // Mock Stripe integration
      try {
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Mock successful subscription update
        const updatedUser = {
          ...user,
          subscription: {
            ...user.subscription,
            plan: 'pro',
            status: 'active',
            startDate: new Date().toISOString(),
          },
          updatedat: new Date().toISOString(),
        };
        
        setUser(updatedUser);
        localStorage.setItem('quiz_io_current_user', JSON.stringify(updatedUser));
        return true;
      } catch (e) {
        console.error('Subscription update failed:', e);
        return false;
      }
    }
  };

  // Usage tracking functions
  const checkUsageLimit = (action: 'session' | 'file' | 'chat'): boolean => {
    if (!user) return false;
    
    // Pro users have unlimited access
    if (user.subscription.plan === 'pro') return true;
    
    // Check if we need to reset monthly usage
    const currentMonth = new Date().toISOString().slice(0, 7);
    if (user.usage.currentMonth !== currentMonth) {
      // Reset usage for new month
      const updatedUser = {
        ...user,
        usage: {
          ...user.usage,
          monthlySessions: 0,
          monthlyFiles: 0,
          currentMonth,
          lastResetDate: new Date().toISOString(),
        }
      };
      setUser(updatedUser);
      localStorage.setItem('quiz_io_current_user', JSON.stringify(updatedUser));
    }
    
    // Check limits for free users
    switch (action) {
      case 'session':
        return user.usage.monthlySessions < 1; // 1 session per month
      case 'file':
        return user.usage.monthlyFiles < 1; // 1 file per session
      case 'chat':
        return false; // Chat not available for free users
      default:
        return false;
    }
  };

  const incrementUsage = async (action: 'session' | 'file'): Promise<void> => {
    if (!user) return;
    
    const updatedUser = {
      ...user,
      usage: {
        ...user.usage,
        monthlySessions: action === 'session' ? user.usage.monthlySessions + 1 : user.usage.monthlySessions,
        monthlyFiles: action === 'file' ? user.usage.monthlyFiles + 1 : user.usage.monthlyFiles,
      }
    };
    
    setUser(updatedUser);
    localStorage.setItem('quiz_io_current_user', JSON.stringify(updatedUser));
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    login,
    signup,
    logout,
    isLoading,
    signInWithGoogle,
    updateSubscription,
    checkUsageLimit,
    incrementUsage,
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
