import { useId } from 'react';

/** useId() output sanitised for use inside SVG `url(#id)` references. */
export function useSvgId(prefix = 'g'): string {
  return prefix + useId().replace(/[^a-zA-Z0-9_-]/g, '');
}
