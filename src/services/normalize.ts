import type { RawAccount, RawDashboard, RawNarrative } from '@/types/api.types';
import {
  PLATFORMS,
  type Account,
  type Channel,
  type Dashboard,
  type Narrative,
  type NarrativeStatus,
  type NarrativeType,
  type PlatformKey,
  type Severity,
  type Stance,
  type Tone,
} from '@/types/domain';

const SEVERITIES: readonly Severity[] = ['Critical', 'High', 'Medium', 'Low', 'Positive'];
const STATUSES: readonly NarrativeStatus[] = ['Critical', 'Escalating', 'Rising', 'Steady', 'Cooling'];
const TYPES: readonly NarrativeType[] = ['Organic critique', 'Inauthentic / coordinated', 'Positive / advocacy', 'Mixed'];

/** Legacy payloads carry literal colours; translate them to semantic tones. */
const COLOUR_TONES: Record<string, Tone> = {
  'var(--neg)': 'neg',
  'var(--pos)': 'pos',
  'var(--acc)': 'acc',
  'var(--neu)': 'neu',
  '#E06AD0': 'mag',
  '#E0A51C': 'amber',
  '#56B6FF': 'sky',
  '#8C9BFF': 'violet',
};

function oneOf<T extends string>(value: string, allowed: readonly T[], fallback: T): T {
  return (allowed as readonly string[]).includes(value) ? (value as T) : fallback;
}

export function isPlatform(value: string): value is PlatformKey {
  return (PLATFORMS as readonly string[]).includes(value);
}

export function slugify(name: string): string {
  return name
    .normalize('NFKD')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function toStance(s: string | undefined): Stance {
  return s === 'positive' || s === 'negative' ? s : 'neutral';
}

function toAccount(a: RawAccount): Account | null {
  if (!isPlatform(a.p)) return null;
  return {
    handle: a.h,
    platform: a.p,
    reach: a.reach,
    followers: a.foll ?? 0,
    stance: toStance(a.stance),
    authenticity: a.auth ?? null,
    burst: Boolean(a.burst),
  };
}

const accounts = (list: RawAccount[] = []) => list.map(toAccount).filter((a): a is Account => a !== null);

function toNarrative(n: RawNarrative): Narrative {
  const platformShare: Narrative['platformShare'] = {};
  for (const [k, v] of Object.entries(n.plat ?? {})) if (isPlatform(k)) platformShare[k] = v;

  return {
    id: slugify(n.name),
    name: n.name,
    type: oneOf(n.type, TYPES, 'Mixed'),
    volume: n.vol,
    neg: n.neg,
    pos: n.pos,
    velocity: n.vel,
    acceleration: n.accel,
    projection: n.proj,
    status: oneOf(n.status, STATUSES, 'Steady'),
    reach: n.reach,
    emotions: n.emo ?? [],
    origin: n.origin,
    claims: n.claims ?? [],
    platformShare,
    geo: n.geo,
    series: n.series ?? [],
    handles: accounts(n.handles),
    posts: (n.posts ?? []).flatMap((p) =>
      isPlatform(p.p) ? [{ handle: p.h, platform: p.p, url: p.url, text: p.text, likes: p.likes }] : [],
    ),
    authenticity: n.auth ?? null,
    coordinationNote: n.coord ?? '',
    cluster: n.cluster
      ? {
          name: n.cluster.name,
          accounts: n.cluster.accounts,
          ageDays: n.cluster.age,
          duplication: n.cluster.dup,
          bursts: n.cluster.bursts,
          verdict: n.cluster.verdict,
          reach: n.cluster.reach,
        }
      : null,
    contagion: (n.contagion ?? []).map((h) => ({ t: h.t, platform: h.plat, note: h.note, volume: h.vol })),
    spread: n.spread ?? { totalAccounts: 0, botAccounts: 0, botPct: 0, copypasta: [] },
    amplifiers: accounts(n.amplifiers ?? n.handles),
  };
}

export function normalizeDashboard(raw: RawDashboard): Dashboard {
  const channels = Object.fromEntries(
    PLATFORMS.map((key): [PlatformKey, Channel] => {
      const c = raw.channels[key] ?? { n: 0, eng: 0, pos: 0, neg: 0, neu: 0, tone: false };
      return [key, { key, mentions: c.n, engagement: c.eng, pos: c.pos, neg: c.neg, neu: c.neu, toneOnly: c.tone }];
    }),
  ) as Record<PlatformKey, Channel>;

  const c = raw.current;
  return {
    topic: raw.topic,
    client: raw.client,
    generatedAt: raw.generated,
    cadenceHours: raw.cadence_h,
    nextRefresh: raw.next_refresh,
    current: {
      threat: c.threat,
      dThreat: c.dThreat,
      volume: c.vol,
      dVolume: c.dVol,
      pos: c.pos,
      neg: c.neg,
      neu: c.neu,
      reach: c.reach,
      totalMentions: c.total_n,
      totalEngagement: c.total_eng,
      scoredMentions: c.scored_n,
      window: c.window,
    },
    cycles: raw.cycles.map((y) => ({
      index: y.i,
      ts: y.ts,
      label: y.label,
      threat: y.threat,
      volume: y.vol,
      neg: y.neg,
      pos: y.pos,
      neu: y.neu,
      reach: y.reach,
      alerts: y.alerts ?? 0,
    })),
    narratives: raw.narratives.map(toNarrative),
    alerts: raw.alerts.map((a) => ({
      id: a.id,
      title: a.title,
      narrative: a.narrative,
      severity: oneOf(a.sev, SEVERITIES, 'Medium'),
      type: a.type,
      status: a.status,
      velocity: a.vel,
      projection: a.proj,
      neg: a.neg,
      reach: a.reach,
      platform: a.plat,
      origin: a.origin,
      authenticity: a.auth,
      why: a.why,
      evidence: a.evidence,
    })),
    channels,
    emotions: raw.emotions.map(([name, pct, colour]) => ({ name, pct, tone: COLOUR_TONES[colour] ?? 'neu' })),
    geo: raw.geo.map(([name, share, neg, note]) => ({ name, share, neg, note })),
    languages: raw.langs.map(([name, share, neg]) => ({ name, share, neg })),
    history: {
      start: raw.history.start,
      end: raw.history.end,
      daily: raw.history.overall.map((d) => ({ index: d.i, date: d.date, threat: d.t, volume: d.v })),
      events: raw.history.events.map((e) => ({ index: e.i, date: e.date, title: e.title, threat: e.t, note: e.note })),
    },
  };
}
