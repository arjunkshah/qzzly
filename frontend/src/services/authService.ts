// Simple localStorage-based auth for demo purposes
// No external dependencies

export interface LoginFormData { 
  email: string; 
  password: string 
}

export interface SignupFormData extends LoginFormData { 
  name: string 
}

type User = {
  id: string;
  email: string;
  name?: string;
};

export function getCurrentUser(): User | null {
  const userData = localStorage.getItem('quiz_io_current_user');
  return userData ? JSON.parse(userData) : null;
}

export async function loginUser(data: LoginFormData): Promise<boolean> {
  // Mock login - always succeeds for demo
  const user = {
    id: `user_${Date.now()}`,
    email: data.email,
    name: data.email.split('@')[0]
  };
  localStorage.setItem('quiz_io_current_user', JSON.stringify(user));
  return true;
}

export async function signupUser(data: SignupFormData): Promise<boolean> {
  // Mock signup - always succeeds for demo
  const user = {
    id: `user_${Date.now()}`,
    email: data.email,
    name: data.name
  };
  localStorage.setItem('quiz_io_current_user', JSON.stringify(user));
  return true;
}

export function logoutUser(): void {
  localStorage.removeItem('quiz_io_current_user');
} 