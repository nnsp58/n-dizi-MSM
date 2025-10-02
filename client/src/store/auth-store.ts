import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '@/types';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (userData: {
    email: string;
    password: string;
    storeName: string;
    ownerName: string;
    phone?: string;
    address?: string;
  }) => Promise<boolean>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,

      login: async (email: string, password: string) => {
        try {
          const user = await db.getUser(email);
          
          if (user && user.password) {
            const isPasswordValid = await bcrypt.compare(password, user.password);
            
            if (isPasswordValid) {
              set({ user, isAuthenticated: true });
              
              // Set first use date if not exists
              const firstUseDate = localStorage.getItem('firstUseDate');
              if (!firstUseDate) {
                localStorage.setItem('firstUseDate', new Date().toISOString());
              }
              
              return true;
            }
          }
          
          return false;
        } catch (error) {
          console.error('Login error:', error);
          return false;
        }
      },

      signup: async (userData) => {
        try {
          // Check if user already exists
          const existingUser = await db.getUser(userData.email);
          if (existingUser) {
            return false;
          }

          // Hash password before storing
          const hashedPassword = await bcrypt.hash(userData.password, 10);

          const newUser: User = {
            id: crypto.randomUUID(),
            email: userData.email,
            password: hashedPassword,
            storeName: userData.storeName,
            ownerName: userData.ownerName,
            phone: userData.phone,
            address: userData.address,
            plan: 'free',
            createdAt: new Date().toISOString()
          };

          await db.saveUser(newUser);
          set({ user: newUser, isAuthenticated: true });
          
          // Set first use date
          localStorage.setItem('firstUseDate', new Date().toISOString());
          
          return true;
        } catch (error) {
          console.error('Signup error:', error);
          return false;
        }
      },

      logout: () => {
        set({ user: null, isAuthenticated: false });
        localStorage.removeItem('auth-storage');
      },

      updateUser: async (userData) => {
        const { user } = get();
        if (!user) return;

        const updatedUser = { ...user, ...userData };
        await db.saveUser(updatedUser);
        set({ user: updatedUser });
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ 
        user: state.user ? {
          ...state.user,
          password: undefined // Never persist password hash in localStorage
        } : null, 
        isAuthenticated: state.isAuthenticated 
      }),
    }
  )
);
