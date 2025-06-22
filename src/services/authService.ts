import { User, Subscription, LoginFormData, SignupFormData } from '@/types/user';

// Local storage keys
const USERS_KEY = 'quiz_io_users';
const CURRENT_USER_KEY = 'quiz_io_current_user';
const SESSIONS_KEY = 'quiz_io_sessions';

// Mock users for development
const mockUsers: User[] = [
  {
    id: 'user_1',
    email: 'demo@quiz.io',
    name: 'Demo User',
    subscription: {
      plan: 'free',
      status: 'active',
      startDate: new Date().toISOString(),
    },
    sessionCount: 2,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
];

// Initialize users in localStorage
const initializeUsers = () => {
  const storedUsers = localStorage.getItem(USERS_KEY);
  if (!storedUsers) {
    localStorage.setItem(USERS_KEY, JSON.stringify(mockUsers));
  }
};

// Get all users
const getUsers = (): User[] => {
  initializeUsers();
  return JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
};

// Save users to localStorage
const saveUsers = (users: User[]) => {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
};

// Get current user
export const getCurrentUser = (): User | null => {
  const userData = localStorage.getItem(CURRENT_USER_KEY);
  if (!userData) return null;
  
  try {
    return JSON.parse(userData);
  } catch {
    return null;
  }
};

// Set current user
const setCurrentUser = (user: User | null) => {
  if (user) {
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(CURRENT_USER_KEY);
  }
};

// Check if user can create more sessions
export const canCreateSession = (user: User): boolean => {
  if (user.subscription.plan === 'pro') {
    return true; // Unlimited sessions for pro users
  }
  
  // Free users get 3 sessions
  return user.sessionCount < 3;
};

// Increment session count for user
export const incrementSessionCount = (userId: string): void => {
  const users = getUsers();
  const userIndex = users.findIndex(u => u.id === userId);
  
  if (userIndex !== -1) {
    users[userIndex].sessionCount += 1;
    users[userIndex].updatedAt = new Date().toISOString();
    saveUsers(users);
    
    // Update current user if it's the same user
    const currentUser = getCurrentUser();
    if (currentUser && currentUser.id === userId) {
      setCurrentUser(users[userIndex]);
    }
  }
};

// Decrement session count for user
export const decrementSessionCount = (userId: string): void => {
  const users = getUsers();
  const userIndex = users.findIndex(u => u.id === userId);
  
  if (userIndex !== -1 && users[userIndex].sessionCount > 0) {
    users[userIndex].sessionCount -= 1;
    users[userIndex].updatedAt = new Date().toISOString();
    saveUsers(users);
    
    // Update current user if it's the same user
    const currentUser = getCurrentUser();
    if (currentUser && currentUser.id === userId) {
      setCurrentUser(users[userIndex]);
    }
  }
};

// Login user
export const loginUser = async (data: LoginFormData): Promise<boolean> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const users = getUsers();
      const user = users.find(u => u.email === data.email);
      
      if (user) {
        // In a real app, you'd verify the password hash
        setCurrentUser(user);
        resolve(true);
      } else {
        resolve(false);
      }
    }, 500); // Simulate API delay
  });
};

// Signup user
export const signupUser = async (data: SignupFormData): Promise<boolean> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const users = getUsers();
      
      // Check if user already exists
      const existingUser = users.find(u => u.email === data.email);
      if (existingUser) {
        resolve(false);
        return;
      }
      
      // Create new user
      const newUser: User = {
        id: `user_${Date.now()}`,
        email: data.email,
        name: data.name,
        subscription: {
          plan: 'free',
          status: 'active',
          startDate: new Date().toISOString(),
        },
        sessionCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      users.push(newUser);
      saveUsers(users);
      setCurrentUser(newUser);
      resolve(true);
    }, 500); // Simulate API delay
  });
};

// Logout user
export const logoutUser = (): void => {
  setCurrentUser(null);
};

// Update subscription
export const updateSubscription = async (
  userId: string, 
  plan: 'free' | 'pro', 
  promoCode?: string
): Promise<boolean> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const users = getUsers();
      const userIndex = users.findIndex(u => u.id === userId);
      
      if (userIndex === -1) {
        resolve(false);
        return;
      }
      
      // Check promo code
      if (plan === 'pro' && promoCode === 'BETAX') {
        // Apply promo code - free pro subscription
        users[userIndex].subscription = {
          plan: 'pro',
          status: 'active',
          startDate: new Date().toISOString(),
        };
      } else if (plan === 'pro') {
        // Regular pro subscription (in real app, this would integrate with Stripe)
        users[userIndex].subscription = {
          plan: 'pro',
          status: 'active',
          startDate: new Date().toISOString(),
          stripeCustomerId: `cus_${Date.now()}`,
          stripeSubscriptionId: `sub_${Date.now()}`,
        };
      } else {
        // Downgrade to free
        users[userIndex].subscription = {
          plan: 'free',
          status: 'active',
          startDate: new Date().toISOString(),
        };
      }
      
      users[userIndex].updatedAt = new Date().toISOString();
      saveUsers(users);
      
      // Update current user if it's the same user
      const currentUser = getCurrentUser();
      if (currentUser && currentUser.id === userId) {
        setCurrentUser(users[userIndex]);
      }
      
      resolve(true);
    }, 500); // Simulate API delay
  });
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