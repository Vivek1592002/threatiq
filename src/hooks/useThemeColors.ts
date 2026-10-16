import { useMemo } from 'react';
import { useThemeStore } from '@/store/theme.store';

/**
 * Resolves CSS custom properties to concrete colours. Needed only where a
 * library must interpolate colours (e.g. choropleth scales); everything else
 * uses `var(--token)` directly.
 */
export function useThemeColors<K extends string>(tokens: readonly K[]): Record<K, string> {
  const theme = useThemeStore((s) => s.theme);
  const key = tokens.join('|');
  return useMemo(() => {
    const cs = getComputedStyle(document.documentElement);
    return Object.fromEntries(tokens.map((t) => [t, cs.getPropertyValue(`--${t}`).trim() || '#888'])) as Record<K, string>;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme, key]);
}
