import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type Theme = 'dark' | 'light';

/** First visit follows the OS; an explicit toggle is remembered. */
const systemTheme = (): Theme =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: light)').matches ? 'light' : 'dark';

interface ThemeState {
  theme: Theme;
  toggle: () => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: systemTheme(),
      toggle: () => set((s) => ({ theme: s.theme === 'dark' ? 'light' : 'dark' })),
    }),
    {
      name: 'rdr.theme',
      storage: createJSONStorage(() => localStorage),
      merge: (p, c) => {
        const t = (p as Partial<ThemeState> | undefined)?.theme;
        return { ...c, theme: t === 'light' || t === 'dark' ? t : c.theme };
      },
    },
  ),
);
