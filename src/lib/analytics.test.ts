import { describe, expect, it } from 'vitest';
import raw from '@/mocks/raw/dashboard.json';
import { normalizeDashboard, slugify } from '@/services/normalize';
import type { RawDashboard } from '@/types/api.types';
import {
  cycleThreatSeries,
  historyStats,
  narrativeForAlert,
  narrativeStats,
  narrativeThreat,
  narrativeVolumeByPlatform,
  platformThreat,
  positivesNeeded,
  pulseThreat,
  seedBaseline,
  tierOf,
  volumeHistory,
} from './analytics';
import { cleanInput, maskProfanity, safeExternalUrl } from './sanitize';
import { applyFilters } from '@/features/narratives/filtering';

const d = normalizeDashboard(raw as unknown as RawDashboard);

describe('normalize', () => {
  it('maps the payload into the domain model', () => {
    expect(d.narratives).toHaveLength(6);
    expect(d.cycles).toHaveLength(28);
    expect(d.history.daily).toHaveLength(365);
    expect(d.narratives[0]!.id).toBe('kgf-hangover-derivative-story');
    expect(d.emotions[1]!.tone).toBe('mag');
  });
  it('slugifies names safely', () => {
    expect(slugify('‘KGF hangover’ — derivative story')).toBe('kgf-hangover-derivative-story');
  });
});

describe('threat analytics', () => {
  it('overall pulse equals current snapshot', () => {
    const p = pulseThreat(d, 'all');
    expect(p.threat).toBe(49);
    expect(p.delta).toBe(3);
  });
  it('platform threat series ends on the platform reading', () => {
    for (const k of ['youtube', 'instagram', 'x', 'news'] as const) {
      const s = cycleThreatSeries(d, k);
      expect(s).toHaveLength(28);
      expect(s[s.length - 1]).toBe(Math.max(15, Math.min(80, platformThreat(d, k).threat)));
    }
  });
  it('history stats are ordered', () => {
    const st = historyStats(pulseThreat(d, 'all').series);
    expect(st.lo).toBeLessThanOrEqual(st.median);
    expect(st.median).toBeLessThanOrEqual(st.hi);
    expect(st.ranges).toHaveLength(3);
  });
  it('platform volume is a share of overall', () => {
    const all = volumeHistory(d, 'all', 30);
    const yt = volumeHistory(d, 'youtube', 30);
    expect(yt[0]!.value).toBeLessThan(all[0]!.value);
  });
});

describe('narrative analytics', () => {
  const n = d.narratives[0]!;
  it('overall stats match the narrative', () => {
    const st = narrativeStats(d, n, 'all');
    expect(st.volume).toBe(n.volume);
    expect(st.threat).toBe(narrativeThreat(n));
  });
  it('per-platform volume sums to the series', () => {
    const split = narrativeVolumeByPlatform(n);
    const sum = split.reduce((s, p) => s + p.values[5]!, 0);
    expect(Math.abs(sum - n.series[5]!)).toBeLessThanOrEqual(split.length);
  });
  it('seeding: no positives needed at current level, more for lower targets', () => {
    const b = seedBaseline(d, n, 'all');
    expect(positivesNeeded(b, b.now)).toBe(0);
    expect(positivesNeeded(b, b.now - 10)).toBeGreaterThan(positivesNeeded(b, b.now - 5));
  });
  it('resolves alerts to narratives', () => {
    for (const a of d.alerts) expect(narrativeForAlert(d.narratives, a.narrative)).not.toBeNull();
  });
  it('tiers by follower count', () => {
    expect(tierOf(6e6)).toBe('Celebrity / Mega');
    expect(tierOf(4000)).toBe('Nano');
  });
  it('filters and sorts', () => {
    const neg = applyFilters(d.narratives, { type: 'all', status: 'all', lean: 'neg', sort: 'vel', q: '' });
    expect(neg.every((x) => x.neg >= 50)).toBe(true);
    expect(neg[0]!.velocity).toBeGreaterThanOrEqual(neg[neg.length - 1]!.velocity);
  });
});

describe('sanitize', () => {
  it('rejects unsafe URLs', () => {
    expect(safeExternalUrl('javascript:alert(1)')).toBeNull();
    expect(safeExternalUrl('http://x.com/a')).toBeNull();
    expect(safeExternalUrl('https://evil.example/x.com')).toBeNull();
    expect(safeExternalUrl('https://www.youtube.com/watch?v=1')).toBe('https://www.youtube.com/watch?v=1');
  });
  it('masks profanity and cleans input', () => {
    expect(maskProfanity('this is shit')).toBe('this is s***');
    expect(cleanInput('  a\u0000b   c  ')).toBe('ab c');
  });
});
