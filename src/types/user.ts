export interface User {
  id: string;
  email: string;
  name: string;
  subscription: Subscription;
  sessionCount: number;
  createdat: string;
  updatedat: string;
  usage: UsageLimits;
}

export interface Subscription {
  plan: 'free' | 'pro';
  status: 'active' | 'inactive' | 'cancelled';
  startDate: string;
  endDate?: string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
}

export interface UsageLimits {
  monthlySessions: number;
  monthlyFiles: number;
  currentMonth: string; // YYYY-MM format
  lastResetDate: string;
}

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (email: string, password: string, name: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
  signInWithGoogle: () => Promise<void>;
  updateSubscription: (plan: 'pro', promoCode?: string) => Promise<boolean>;
  checkUsageLimit: (action: 'session' | 'file' | 'chat') => boolean;
  incrementUsage: (action: 'session' | 'file') => Promise<void>;
}

export interface LoginFormData {
  email: string;
  password: string;
}

export interface SignupFormData {
  email: string;
  password: string;
  name: string;
}

export interface SubscriptionFormData {
  plan: 'free' | 'pro';
  promoCode?: string;
}  