import { supabase } from './supabaseClient';

export const AuthService = {
  async signUp({ email, password }: { email: string; password: string }) {
    const { data, error } = await supabase.auth.signUp({ email, password });
    return { user: data.user, error: error?.message };
  },
  async signIn({ email, password }: { email: string; password: string }) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    return { user: data.user, error: error?.message };
  },
  async signInWithGoogle() {
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } });
    // This method will redirect, so no user is returned here
    return { user: null, error: error?.message };
  },
  async signOut() {
    const { error } = await supabase.auth.signOut();
    return { error: error?.message };
  },
  async getCurrentUser() {
    const { data, error } = await supabase.auth.getUser();
    return { user: data.user, error: error?.message };
  },
  onAuthStateChange(callback: (user: any) => void) {
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      callback(session?.user ?? null);
    });
    return { data: { subscription } };
  },
};

export type AuthUser = {
  id: string;
  email: string;
  name?: string;
}; 