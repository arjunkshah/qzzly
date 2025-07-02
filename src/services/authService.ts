import { User, LoginFormData, SignupFormData } from '@/types/user';
import { supabase } from './supabaseClient';

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

// Login user with Supabase Auth
export const loginUser = async (data: LoginFormData): Promise<User> => {
  const { data: authData, error } = await supabase.auth.signInWithPassword({
    email: data.email,
    password: data.password,
  });
  if (error || !authData.user) throw error || new Error('Login failed');

  // Fetch user profile from users table
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('id', authData.user.id)
    .single();
  if (userError || !userData) throw userError || new Error('User profile not found');
  setCurrentUser(userData);
  return userData;
};

// Signup user with Supabase Auth
export const signupUser = async (data: SignupFormData): Promise<User> => {
  const { data: authData, error } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      data: { name: data.name },
    },
  });
  if (error || !authData.user) throw error || new Error('Signup failed');

  // Insert user profile into users table
  const { data: userData, error: userError } = await supabase
    .from('users')
    .insert([
      {
        id: authData.user.id,
        email: data.email,
        name: data.name,
        subscription: { plan: 'free', status: 'active', startDate: new Date().toISOString() },
        sessionCount: 0,
        createdat: new Date().toISOString(),
        updatedat: new Date().toISOString(),
      },
    ])
    .select()
    .single();
  if (userError || !userData) throw userError || new Error('User profile creation failed');
  setCurrentUser(userData);
  return userData;
};

// Logout user
export const logoutUser = async (): Promise<void> => {
  await supabase.auth.signOut();
  setCurrentUser(null);
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
  // Fetch current user
  const { data: user, error: fetchError } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();
  if (fetchError || !user) throw fetchError || new Error('User not found');
  // Increment
  const { data: updated, error } = await supabase
    .from('users')
    .update({ sessionCount: (user.sessionCount || 0) + 1, updatedat: new Date().toISOString() })
    .eq('id', userId)
    .select()
    .single();
  if (error || !updated) throw error || new Error('Failed to increment session count');
  setCurrentUser(updated);
  return updated;
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
  return code.trim().toUpperCase() === 'BETAX';
};  