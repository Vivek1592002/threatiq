import type { Option } from '@/components/ui/controls';
import { PLATFORM_LABEL } from './analytics';
import { PLATFORMS, type PlatformFilter, type PlatformKey } from '@/types/domain';

export const PLATFORM_OPTIONS: Option<PlatformFilter>[] = [
  { value: 'all', label: 'Overall' },
  ...PLATFORMS.map((p) => ({ value: p, label: PLATFORM_LABEL[p] })),
];

export function platformOptions(keys: PlatformKey[]): Option<PlatformFilter>[] {
  return [{ value: 'all', label: 'Overall' }, ...keys.map((p) => ({ value: p, label: PLATFORM_LABEL[p] }))];
}

export const PLATFORM_COLOR: Record<PlatformKey, string> = {
  youtube: 'var(--youtube)',
  instagram: 'var(--instagram)',
  x: 'var(--x)',
  news: 'var(--news)',
};
