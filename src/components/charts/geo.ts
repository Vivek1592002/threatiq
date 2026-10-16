import { useMemo } from 'react';
import { scaleLinear } from 'd3-scale';
import { useThemeColors } from '@/hooks/useThemeColors';
import { mix } from '@/lib/color';
import { useThemeStore } from '@/store/theme.store';
import type { GeoRegion } from '@/types/domain';

/** State / UT polygons → reporting regions. Everything else rolls up into "Rest of India". */
export const STATE_TO_REGION: Record<string, string> = {
  Karnataka: 'Karnataka',
  Maharashtra: 'Maharashtra',
  Telangana: 'Telangana',
  'Tamil Nadu': 'Tamil Nadu',
  Delhi: 'Delhi-NCR',
  Kerala: 'Kerala',
};
export const FALLBACK_REGION = 'Rest of India';

export function regionForState(state: string): string {
  return STATE_TO_REGION[state] ?? FALLBACK_REGION;
}

/**
 * Negative-sentiment colour scale. Semantic tones are blended toward the
 * panel colour so large filled areas stay calm rather than neon.
 */
export function useNegScale(regions: GeoRegion[]) {
  const c = useThemeColors(['pos', 'warn', 'neg', 'panel'] as const);
  const theme = useThemeStore((s) => s.theme);
  return useMemo(() => {
    const soften = theme === 'dark' ? 0.26 : 0.18;
    const colors = {
      pos: mix(c.pos, c.panel, soften),
      warn: mix(c.warn, c.panel, soften),
      neg: mix(c.neg, c.panel, soften),
    };
    const negs = regions.filter((r) => r.name !== 'Overseas').map((r) => r.neg);
    const lo = Math.min(...negs);
    const hi = Math.max(...negs);
    const scale = scaleLinear<string>().domain([lo, (lo + hi) / 2, hi]).range([colors.pos, colors.warn, colors.neg]).clamp(true);
    return { scale, lo, hi, colors };
  }, [regions, c, theme]);
}
