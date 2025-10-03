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
              // Establish backend session for payments
              let backendUser = null;
              try {
                const response = await fetch('/api/auth/login', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  credentials: 'include',
                  body: JSON.stringify({ email, password }),
                });

                if (response.ok) {
                  const data = await response.json();
                  backendUser = data.user;
                } else {
                  console.warn('Backend login failed, proceeding with local-only auth');
                }
              } catch (backendError) {
                console.warn('Backend login error, proceeding offline:', backendError);
              }

              // Merge backend user data (includes isAdmin, fcmToken) with local user data
              const mergedUser = backendUser ? { ...user, ...backendUser } : user;
              
              // Persist merged user data back to IndexedDB for offline access
              if (backendUser) {
                try {
                  await db.saveUser(mergedUser);
                } catch (dbError) {
                  console.warn('Failed to persist merged user to IndexedDB:', dbError);
                }
              }
              
              set({ user: mergedUser, isAuthenticated: true });
              
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
          // Check if user already exists locally
          const existingUser = await db.getUser(userData.email);
          if (existingUser) {
            return false;
          }

          // Register with backend first to establish session
          let backendRegistrationSuccess = false;
          try {
            const response = await fetch('/api/auth/register', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({
                email: userData.email,
                password: userData.password,
                storeName: userData.storeName,
                ownerName: userData.ownerName,
                phone: userData.phone || '',
                address: userData.address || '',
              }),
            });

            if (response.ok) {
              backendRegistrationSuccess = true;
            } else {
              const error = await response.json();
              console.error('Backend registration failed:', error);
            }
          } catch (backendError) {
            console.error('Backend registration error:', backendError);
          }

          if (!backendRegistrationSuccess) {
            console.warn('⚠️ Backend registration failed. App will work offline, but premium subscriptions will not be available.');
          }

          // Hash password before storing locally
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
