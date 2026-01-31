import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '@/types';

interface UserState {
  currentUser: User | null;
  setCurrentUser: (user: User) => void;
  updateProfile: (updates: Partial<User>) => void;
  logout: () => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      currentUser: null,

      setCurrentUser: (user) => set({ currentUser: user }),

      updateProfile: (updates) =>
        set((state) => ({
          currentUser: state.currentUser
            ? { ...state.currentUser, ...updates }
            : null,
        })),

      logout: () => set({ currentUser: null }),
    }),
    {
      name: 'shadowtalk-user',
    }
  )
);
