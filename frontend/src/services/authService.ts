// Simple local-storage based auth stubs. Replace with real Supabase/Stripe logic later.

export interface LoginFormData { email: string; password: string }
export interface SignupFormData extends LoginFormData { name: string }

const STORAGE_KEY = 'quiz_io_current_user';

type User = {
  id: string;
  email: string;
  name?: string;
};

export function getCurrentUser(): User | null {
  const json = localStorage.getItem(STORAGE_KEY);
  return json ? (JSON.parse(json) as User) : null;
}

export async function loginUser(data: LoginFormData): Promise<boolean> {
  const user: User = { id: '1', email: data.email, name: data.email };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  return true;
}

export async function signupUser(data: SignupFormData): Promise<boolean> {
  return loginUser(data);
}

export function logoutUser(): void {
  localStorage.removeItem(STORAGE_KEY);
} 