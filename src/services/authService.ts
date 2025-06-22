import { User, LoginFormData, SignupFormData } from '@/types/user';
import { supabase } from './supabaseClient';
import { User as SupabaseUser } from '@supabase/supabase-js';

const CURRENT_USER_KEY = 'quiz_io_current_user';

const mapUser = (sbUser: SupabaseUser): User => {
  const meta = sbUser.user_metadata || {};
  return {
    id: sbUser.id,
    email: sbUser.email,
    name: meta.name || sbUser.email,
    subscription: meta.subscription || { plan: 'free', status: 'active', startDate: sbUser.created_at },
    sessionCount: meta.sessionCount || 0,
    createdAt: sbUser.created_at,
    updatedAt: sbUser.updated_at || sbUser.created_at,
  };
};

export const getCurrentUser = (): User | null => {
  const userData = localStorage.getItem(CURRENT_USER_KEY);
  if (!userData) return null;
  try {
    return JSON.parse(userData);
  } catch {
    return null;
  }
};

const setCurrentUser = (user: User | null) => {
  if (user) {
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(CURRENT_USER_KEY);
  }
};

export const loginUser = async (data: LoginFormData): Promise<User> => {
  const { data: res, error } = await supabase.auth.signInWithPassword({
    email: data.email,
    password: data.password,
  });
  if (error || !res.user) throw error || new Error('Login failed');
  const user = mapUser(res.user);
  setCurrentUser(user);
  return user;
};

export const signupUser = async (data: SignupFormData): Promise<User> => {
  const { data: res, error } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: { data: { name: data.name, sessionCount: 0, subscription: { plan: 'free', status: 'active', startDate: new Date().toISOString() } } },
  });
  if (error || !res.user) throw error || new Error('Signup failed');
  const user = mapUser(res.user);
  setCurrentUser(user);
  return user;
};

export const signInWithGoogle = async (): Promise<void> => {
  const { error } = await supabase.auth.signInWithOAuth({ provider: 'google' });
  if (error) throw error;
};

export const logoutUser = async (): Promise<void> => {
  await supabase.auth.signOut();
  setCurrentUser(null);
  localStorage.removeItem('quiz_io_sessions');
};

export const canCreateSession = (user: User): boolean => {
  if (user.subscription.plan === 'pro') return true;
  return user.sessionCount < 3;
};

export const incrementSessionCount = async (userId: string): Promise<User> => {
  const { data: { user }, error } = await supabase.auth.updateUser({
    data: { sessionCount: (getCurrentUser()?.sessionCount || 0) + 1 },
  });
  if (error || !user) throw error || new Error('Unable to update user');
  const updatedUser = mapUser(user);
  setCurrentUser(updatedUser);
  return updatedUser;
};

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

export const validatePromoCode = (code: string): boolean => code === 'BETAX';
