import type { NarrativeStatus, Severity, Tone } from '@/types/domain';

export type ZoneWord = 'HEALTHY' | 'ELEVATED' | 'HOSTILE' | 'CRITICAL';

export interface Zone {
  word: ZoneWord;
  tone: Tone;
  advice: string;
}

/** Narrative zone used for copy & status (3 tiers). */
export function zoneOf(v: number): Zone {
  if (v < 30)
    return { word: 'HEALTHY', tone: 'pos', advice: 'Conversation is net-supportive. Protect momentum and keep the advocates fuelled.' };
  if (v < 45)
    return {
      word: 'ELEVATED',
      tone: 'warn',
      advice:
        'A vocal negative bloc is shaping the story alongside strong fan pull. Contain the sceptic narratives before they set the default read.',
    };
  return {
    word: 'HOSTILE',
    tone: 'neg',
    advice: 'Negative conversation is dominant and compounding each cycle. Intervene on the loudest and fastest-moving narratives now.',
  };
}

/** Gauge zone (4 tiers — adds CRITICAL above 70). */
export function gaugeZoneOf(v: number): { word: ZoneWord; tone: Tone } {
  if (v < 30) return { word: 'HEALTHY', tone: 'pos' };
  if (v < 45) return { word: 'ELEVATED', tone: 'warn' };
  if (v < 70) return { word: 'HOSTILE', tone: 'neg' };
  return { word: 'CRITICAL', tone: 'fire' };
}

/** Background bands for threat charts: [from, to, tone]. */
export const THREAT_BANDS: readonly [number, number, Tone][] = [
  [0, 30, 'pos'],
  [30, 45, 'warn'],
  [45, 70, 'neg'],
  [70, 100, 'fire'],
];

/** Gauge arc bands. */
export const GAUGE_BANDS: readonly [number, number, Tone][] = [
  [0, 30, 'pos'],
  [30, 50, 'warn'],
  [50, 75, 'neg'],
  [75, 100, 'fire'],
];

export const severityTone: Record<Severity, Tone> = {
  Critical: 'neg',
  High: 'high',
  Medium: 'warn',
  Positive: 'pos',
  Low: 'neu',
};

export const statusTone: Record<NarrativeStatus, Tone> = {
  Critical: 'neg',
  Escalating: 'high',
  Rising: 'high',
  Steady: 'neu',
  Cooling: 'pos',
};

export function authTone(a: number): Tone {
  return a >= 70 ? 'pos' : a >= 40 ? 'warn' : 'neg';
}

export function verdictTone(verdict: string): Tone {
  if (verdict.startsWith('Inauthentic')) return 'neg';
  if (verdict.startsWith('Likely')) return 'high';
  return 'pos';
}

export function langTone(neg: number): Tone {
  return neg >= 45 ? 'neg' : neg >= 38 ? 'warn' : 'pos';
}

export function botTone(pct: number): Tone {
  return pct >= 25 ? 'neg' : pct >= 10 ? 'high' : 'pos';
}

export const toneVar = (t: Tone) => `var(--${t})`;
