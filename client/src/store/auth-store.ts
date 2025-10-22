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
          // 1. Local/IndexedDB check
          const user = await db.getUser(email);
          
          if (user && user.password) {
            const isPasswordValid = await bcrypt.compare(password, user.password);
            
            if (isPasswordValid) {
              // 2. Backend session establishment (for payments/premium features)
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

              // 3. Merge and Persist User Data
              const mergedUser = backendUser ? { ...user, ...backendUser } : user;
              
              if (backendUser) {
                try {
                  // Save merged user data (e.g., isAdmin, fcmToken) back to IndexedDB
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
          // 1. Check if user already exists locally
          const existingUser = await db.getUser(userData.email);
          if (existingUser) {
            return false;
          }

          // 2. Register with backend first
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
              // Note: If backend rejects, we still proceed to save locally for offline use,
              // but a robust app might choose to return false here.
              const error = await response.json();
              console.error('Backend registration failed:', error);
            }
          } catch (backendError) {
            console.error('Backend registration error:', backendError);
          }

          if (!backendRegistrationSuccess) {
            console.warn('⚠️ Backend registration failed. App will work offline, but premium subscriptions will not be available.');
          }

          // 3. Hash password and save locally
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
        // Optional: clear local db data if needed
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
          // Only persist safe user data, exclude sensitive fields like password hash
          ...state.user,
          password: undefined 
        } : null, 
        isAuthenticated: state.isAuthenticated 
      }),
    }
  )
);
