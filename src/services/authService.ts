import { User, LoginFormData, SignupFormData } from '@/types/user';
import { apiRequest } from './apiService';

const CURRENT_USER_KEY = 'quiz_io_current_user';

// Get current user from local storage
export const getCurrentUser = (): User | null => {
  const userData = localStorage.getItem(CURRENT_USER_KEY);
  if (!userData) return null;

  try {
    return JSON.parse(userData);
  } catch {
    return null;
  }
};

// Set current user in local storage
const setCurrentUser = (user: User | null) => {
  if (user) {
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(CURRENT_USER_KEY);
  }
};

// Login user
export const loginUser = async (data: LoginFormData): Promise<User> => {
  const user = await apiRequest<User>('/api/login', 'POST', data);
  setCurrentUser(user);
  return user;
};

// Signup user
export const signupUser = async (data: SignupFormData): Promise<User> => {
  const newUser = await apiRequest<User>('/api/users', 'POST', data);
  setCurrentUser(newUser);
  return newUser;
};

// Logout user
export const logoutUser = (): void => {
  setCurrentUser(null);
  // Also clear sessions to prevent mismatches after logout
  localStorage.removeItem('quiz_io_sessions');
};

// Check if user can create more sessions
export const canCreateSession = (user: User): boolean => {
  if (user.subscription.plan === 'pro') {
    return true;
  }
  return user.sessionCount < 3;
};

// Increment session count for user
export const incrementSessionCount = async (userId: string): Promise<User> => {
  const updatedUser = await apiRequest<User>(`/api/users/${userId}/increment-session`, 'POST');
  
  const currentUser = getCurrentUser();
  if (currentUser && currentUser.id === userId) {
    setCurrentUser(updatedUser);
  }
  
  return updatedUser;
};

// Get subscription info
export const getSubscriptionInfo = (): { plan: 'free' | 'pro'; price: string; features: string[] } => {
  return {
    plan: 'pro',
    price: '$9.99/month',
    features: [
      'Unlimited study sessions',
      'Advanced AI features',
      'Priority support',
      'Export capabilities',
      'Custom study plans'
    ]
  };
};

// Check if promo code is valid
export const validatePromoCode = (code: string): boolean => {
  return code === 'BETAX';
}; 