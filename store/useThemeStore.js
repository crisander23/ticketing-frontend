'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export const useThemeStore = create(
  persist(
    (set, get) => ({
      /** 'dark' | 'light' — default to the gradient/dark look */
      theme: 'dark',
      setTheme: (t) => set({ theme: t === 'light' ? 'light' : 'dark' }),
      toggleTheme: () => set({ theme: get().theme === 'dark' ? 'light' : 'dark' }),
    }),
    {
      name: 'ticketing_theme',
      storage: createJSONStorage(() =>
        typeof window !== 'undefined' ? localStorage : undefined
      ),
      partialize: (s) => ({ theme: s.theme }),
    }
  )
);
