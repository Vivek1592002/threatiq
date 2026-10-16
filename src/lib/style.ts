import type { CSSProperties } from 'react';
import type { Tone } from '@/types/domain';
import { toneVar } from './threat';

export const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ');

/** Sets `--tone` from a semantic tone, a hex colour or a CSS var(). */
export const toneStyle = (tone: Tone | string): CSSProperties =>
  ({ '--tone': tone.startsWith('#') || tone.startsWith('var(') ? tone : toneVar(tone as Tone) }) as CSSProperties;
