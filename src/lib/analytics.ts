/**
 * Derived analytics. Pure functions over the domain model — no React, no DOM —
 * so they are trivially unit-testable and reusable across views.
 */
import {
  PLATFORMS,
  type Account,
  type Dashboard,
  type HistoryPoint,
  type Narrative,
  type PlatformFilter,
  type PlatformKey,
  type TimelineEvent,
} from '@/types/domain';

export const PLATFORM_LABEL: Record<PlatformKey, string> = {
  youtube: 'YouTube',
  instagram: 'Instagram',
  x: 'Twitter',
  news: 'News',
};

export const platformLabel = (k: PlatformFilter) => (k === 'all' ? 'Overall' : PLATFORM_LABEL[k]);

export const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

/** Deterministic per-key seed so synthetic per-platform curves are stable across renders. */
export const seedOf = (k: string) => [...k].reduce((a, c) => a + c.charCodeAt(0), 0);

/* ------------------------------------------------------------------ */
/* Channel-level                                                       */
/* ------------------------------------------------------------------ */

/** Mention-weighted negative % across channels. */
export function weightedChannelNeg(d: Dashboard): number {
  let wn = 0;
  let n0 = 0;
  for (const p of PLATFORMS) {
    wn += d.channels[p].mentions * d.channels[p].neg;
    n0 += d.channels[p].mentions;
  }
  return n0 ? wn / n0 : 0;
}

export interface PlatformThreat {
  scored: number;
  negCount: number;
  threat: number;
}

/** Threat for a platform, with channel sentiment scaled onto the current cycle level. */
export function platformThreat(d: Dashboard, k: PlatformFilter): PlatformThreat {
  if (k === 'all') {
    const scored = d.current.scoredMentions;
    return { scored, negCount: Math.round((scored * d.current.neg) / 100), threat: d.current.threat };
  }
  const f = d.current.neg / weightedChannelNeg(d);
  const c = d.channels[k];
  const sneg = c.neg * f;
  return { scored: c.mentions, negCount: Math.round((c.mentions * sneg) / 100), threat: Math.round(sneg) };
}

/** Threat over the 6-hour cycles for a platform. */
export function cycleThreatSeries(d: Dashboard, k: PlatformFilter): number[] {
  const base = d.cycles.map((c) => c.threat);
  if (k === 'all') return base;
  const off = platformThreat(d, k).threat - (base[base.length - 1] ?? 0);
  const seed = seedOf(k);
  return base.map((v, i) => {
    const jitter = i < base.length - 1 ? Math.sin(seed + i * 12.9) * 0.5 * 4 : 0;
    return clamp(Math.round(v + off + jitter), 15, 80);
  });
}

/** 365-day threat history for a platform. */
export function threatHistory(d: Dashboard, k: PlatformFilter): HistoryPoint[] {
  if (k === 'all') return d.history.daily.map((p) => ({ index: p.index, date: p.date, value: p.threat }));
  const off = platformThreat(d, k).threat - d.current.threat;
  const seed = seedOf(k);
  return d.history.daily.map((p) => ({
    index: p.index,
    date: p.date,
    value: clamp(Math.round(p.threat + off + Math.sin(seed + p.index * 0.7) * 2.2), 12, 90),
  }));
}

/** Timeline events re-pinned to a series' values. */
export function eventsOn(events: TimelineEvent[], series: HistoryPoint[]): TimelineEvent[] {
  const byIndex = new Map(series.map((p) => [p.index, p.value]));
  return events.map((e) => ({ ...e, threat: byIndex.get(e.index) ?? e.threat }));
}

export interface PulseThreat {
  threat: number;
  delta: number;
  series: HistoryPoint[];
  events: TimelineEvent[];
}

export function pulseThreat(d: Dashboard, k: PlatformFilter): PulseThreat {
  if (k === 'all') {
    return { threat: d.current.threat, delta: d.current.dThreat, series: threatHistory(d, 'all'), events: d.history.events };
  }
  const series = threatHistory(d, k);
  const cyc = cycleThreatSeries(d, k);
  return {
    threat: platformThreat(d, k).threat,
    delta: (cyc[cyc.length - 1] ?? 0) - (cyc[cyc.length - 2] ?? 0),
    series,
    events: eventsOn(d.history.events, series),
  };
}

export interface HistStats {
  hi: number;
  hiDate: string;
  lo: number;
  loDate: string;
  median: number;
  ranges: { label: string; lo: number; hi: number }[];
}

export function historyStats(series: HistoryPoint[]): HistStats {
  const vals = series.map((p) => p.value);
  const sorted = [...vals].sort((a, b) => a - b);
  let hiI = 0;
  let loI = 0;
  vals.forEach((v, i) => {
    if (v > vals[hiI]!) hiI = i;
    if (v < vals[loI]!) loI = i;
  });
  const range = (n: number) => {
    const s = vals.slice(-n);
    return { lo: Math.min(...s), hi: Math.max(...s) };
  };
  return {
    hi: vals[hiI] ?? 0,
    hiDate: series[hiI]?.date ?? '',
    lo: vals[loI] ?? 0,
    loDate: series[loI]?.date ?? '',
    median: sorted[Math.floor(sorted.length / 2)] ?? 0,
    ranges: [
      { label: 'Last 2 months', ...range(60) },
      { label: 'Last 6 months', ...range(180) },
      { label: 'Last 9 months', ...range(270) },
    ],
  };
}

/** Daily conversation volume, optionally a platform's share of it. */
export function volumeHistory(d: Dashboard, k: PlatformFilter, days = 365): HistoryPoint[] {
  let share = 1;
  if (k !== 'all') {
    const total = PLATFORMS.reduce((s, p) => s + d.channels[p].mentions, 0);
    share = total ? d.channels[k].mentions / total : 0;
  }
  return d.history.daily.slice(-days).map((p) => ({ index: p.index, date: p.date, value: Math.round(p.volume * share) }));
}

/* ------------------------------------------------------------------ */
/* Narrative-level                                                     */
/* ------------------------------------------------------------------ */

export function narrativePlatforms(n: Narrative): PlatformKey[] {
  return PLATFORMS.filter((k) => (n.platformShare[k] ?? 0) > 0);
}

export function narrativeThreat(n: Narrative): number {
  return clamp(Math.round(n.neg * 0.72 + Math.min(18, n.velocity / 35) + Math.max(0, n.projection) * 0.9), 5, 98);
}

function channelBias(d: Dashboard, k: PlatformKey): number {
  return d.channels[k].neg - weightedChannelNeg(d);
}

export function narrativePlatformThreat(d: Dashboard, n: Narrative, k: PlatformFilter): number {
  if (k === 'all') return narrativeThreat(n);
  return clamp(Math.round(narrativeThreat(n) + channelBias(d, k) * 0.6), 5, 98);
}

export function narrativePlatformNeg(d: Dashboard, n: Narrative, k: PlatformFilter): number {
  if (k === 'all') return n.neg;
  return clamp(Math.round(n.neg + channelBias(d, k) * 0.6), 3, 95);
}

export interface NarrativeStats {
  volume: number;
  velocity: number;
  reach: number;
  projection: number;
  authenticity: number | null;
  threat: number;
}

export function narrativeStats(d: Dashboard, n: Narrative, k: PlatformFilter): NarrativeStats {
  const share = k === 'all' ? 1 : (n.platformShare[k] ?? 0) / 100;
  const oT = narrativeThreat(n);
  const pT = narrativePlatformThreat(d, n, k);
  const projection = k === 'all' ? n.projection : Math.round((n.projection * pT) / Math.max(1, oT));
  const authenticity =
    n.authenticity == null ? null : k === 'all' ? n.authenticity : clamp(Math.round(n.authenticity - (pT - oT) * 0.5), 5, 99);
  return {
    volume: Math.round(n.volume * share),
    velocity: Math.round(n.velocity * share),
    reach: Math.round(n.reach * share),
    projection,
    authenticity,
    threat: pT,
  };
}

export function platformBreakdown(d: Dashboard, n: Narrative) {
  return narrativePlatforms(n).map((k) => ({ platform: k, ...narrativeStats(d, n, k) }));
}

/** Per-platform volume split of a narrative's cycle series (drifts around its base share). */
export function narrativeVolumeByPlatform(n: Narrative): { platform: PlatformKey; values: number[] }[] {
  const ks = narrativePlatforms(n);
  const rows = n.series.map((tot, i) => {
    const sh: Partial<Record<PlatformKey, number>> = {};
    let sum = 0;
    for (const k of ks) {
      const base = (n.platformShare[k] ?? 0) / 100;
      const v = Math.max(0.01, base * (1 + 0.22 * Math.sin(seedOf(k) + i / 3.2)));
      sh[k] = v;
      sum += v;
    }
    return Object.fromEntries(ks.map((k) => [k, Math.round((tot * (sh[k] ?? 0)) / sum)])) as Record<PlatformKey, number>;
  });
  return ks.map((k) => ({ platform: k, values: rows.map((r) => r[k] ?? 0) }));
}

export interface SeedBaseline {
  now: number;
  negCount: number;
  scored: number;
  label: string;
}

export function seedBaseline(d: Dashboard, n: Narrative, k: PlatformFilter): SeedBaseline {
  if (k === 'all') {
    return { now: narrativeThreat(n), negCount: Math.round((n.volume * n.neg) / 100), scored: n.volume, label: 'all platforms' };
  }
  const share = n.platformShare[k] ?? 0;
  const platVol = Math.round((n.volume * share) / 100);
  return {
    now: narrativePlatformThreat(d, n, k),
    negCount: Math.round((platVol * narrativePlatformNeg(d, n, k)) / 100),
    scored: platVol,
    label: PLATFORM_LABEL[k],
  };
}

/** Positive comments needed to dilute negatives down to a target threat. */
export function positivesNeeded(b: SeedBaseline, target: number): number {
  if (target >= b.now || target <= 0) return 0;
  return Math.max(0, Math.round(b.negCount / (target / 100) - b.scored));
}

export type Tier = 'Celebrity / Mega' | 'Macro' | 'Mid' | 'Micro' | 'Nano';
export const TIER_ORDER: readonly Tier[] = ['Celebrity / Mega', 'Macro', 'Mid', 'Micro', 'Nano'];

export function tierOf(followers: number): Tier {
  if (followers >= 5e6) return 'Celebrity / Mega';
  if (followers >= 5e5) return 'Macro';
  if (followers >= 5e4) return 'Mid';
  if (followers >= 5e3) return 'Micro';
  return 'Nano';
}

export function tierBreakdown(accounts: Account[]) {
  const map = new Map<Tier, { count: number; reach: number }>();
  for (const a of accounts) {
    const t = tierOf(a.followers);
    const cur = map.get(t) ?? { count: 0, reach: 0 };
    cur.count += 1;
    cur.reach += a.reach;
    map.set(t, cur);
  }
  return TIER_ORDER.filter((t) => map.has(t)).map((t) => ({ tier: t, ...map.get(t)! }));
}

/** Alerts reference narratives by (possibly shortened) name. */
export function narrativeForAlert(narratives: Narrative[], name: string): Narrative | null {
  const q = name.toLowerCase();
  const exact = narratives.find((n) => n.name.toLowerCase() === q);
  if (exact) return exact;
  const key = q.slice(0, 9);
  return narratives.find((n) => n.name.toLowerCase().startsWith(key) || q.startsWith(n.name.toLowerCase().slice(0, 9))) ?? null;
}

export function isUrgent(sev: string): boolean {
  return sev === 'Critical' || sev === 'High';
}
