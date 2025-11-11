'use client';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      isLoggedIn: false,

      login(user) {
        set({ user, isLoggedIn: true });
      },

      logout() {
        set({ user: null, isLoggedIn: false });
      },
    }),
    {
      name: 'ticketing_auth', // localStorage key
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ user: s.user, isLoggedIn: s.isLoggedIn }),
    }
  )
);
