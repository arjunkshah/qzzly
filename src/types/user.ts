export interface User {
  id: string;
  email: string;
  name: string;
  subscription: Subscription;
  sessionCount: number;
  created_at: string;
  updated_at: string;
}

export interface Subscription {
  plan: 'free' | 'pro';
  status: 'active' | 'inactive' | 'cancelled';
  startDate: string;
  endDate?: string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
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