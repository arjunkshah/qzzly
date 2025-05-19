
import React, { createContext, useContext, useState, useEffect } from 'react';

type User = {
  id: string;
  email: string;
  name?: string;
};

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (email: string, password: string, name?: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for user in localStorage on initial load
    const storedUser = localStorage.getItem('quizio_user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        localStorage.removeItem('quizio_user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    // In a real app, this would be an API call to validate credentials
    // For now, we'll simulate a login with basic validation
    setIsLoading(true);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Simple validation (in a real app, this would be server-side)
    if (!email || !password) {
      setIsLoading(false);
      return false;
    }
    
    // Demo - accept any properly formatted email with password length >= 6
    if (email.includes('@') && password.length >= 6) {
      const newUser = {
        id: `user_${Date.now()}`,
        email,
        name: email.split('@')[0]
      };
      
      setUser(newUser);
      localStorage.setItem('quizio_user', JSON.stringify(newUser));
      setIsLoading(false);
      return true;
    }
    
    setIsLoading(false);
    return false;
  };

  const signup = async (email: string, password: string, name?: string): Promise<boolean> => {
    // In a real app, this would create a new user in the database
    setIsLoading(true);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Simple validation
    if (!email || !password || password.length < 6) {
      setIsLoading(false);
      return false;
    }
    
    // Check email format
    if (!email.includes('@')) {
      setIsLoading(false);
      return false;
    }
    
    const newUser = {
      id: `user_${Date.now()}`,
      email,
      name: name || email.split('@')[0]
    };
    
    setUser(newUser);
    localStorage.setItem('quizio_user', JSON.stringify(newUser));
    setIsLoading(false);
    return true;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('quizio_user');
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated: !!user, 
      login, 
      signup, 
      logout, 
      isLoading 
    }}>
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
