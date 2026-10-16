/**
 * Domain model consumed by the UI.
 * The API payload (see `api.types.ts`) is normalised into these shapes in
 * `services/normalize.ts`, so components never deal with tuples or raw keys.
 */

export const PLATFORMS = ['youtube', 'instagram', 'x', 'news'] as const;
export type PlatformKey = (typeof PLATFORMS)[number];
export type PlatformFilter = PlatformKey | 'all';

export type Severity = 'Critical' | 'High' | 'Medium' | 'Low' | 'Positive';
export type NarrativeStatus = 'Critical' | 'Escalating' | 'Rising' | 'Steady' | 'Cooling';
export type NarrativeType = 'Organic critique' | 'Inauthentic / coordinated' | 'Positive / advocacy' | 'Mixed';
export type Stance = 'positive' | 'negative' | 'neutral';

/** Semantic colour tokens — resolved to CSS variables by the theme layer. */
export type Tone = 'pos' | 'neg' | 'neu' | 'warn' | 'acc' | 'fire' | 'high' | 'mag' | 'amber' | 'sky' | 'violet';

export interface CurrentSnapshot {
  threat: number;
  dThreat: number;
  volume: number;
  dVolume: number;
  pos: number;
  neg: number;
  neu: number;
  reach: number;
  totalMentions: number;
  totalEngagement: number;
  scoredMentions: number;
  window: string;
}

export interface Cycle {
  index: number;
  ts: string;
  label: string;
  threat: number;
  volume: number;
  neg: number;
  pos: number;
  neu: number;
  reach: number;
  alerts: number;
}

export interface Account {
  handle: string;
  platform: PlatformKey;
  reach: number;
  followers: number;
  stance: Stance;
  authenticity: number | null;
  burst: boolean;
}

export interface Post {
  handle: string;
  platform: PlatformKey;
  url: string;
  text: string;
  likes: number;
}

export interface ContagionHop {
  t: string;
  platform: string;
  note: string;
  volume: number;
}

export interface Cluster {
  name: string;
  accounts: number;
  ageDays: number;
  duplication: number;
  bursts: number;
  verdict: string;
  reach: number;
}

export interface SpreadStats {
  totalAccounts: number;
  botAccounts: number;
  botPct: number;
  copypasta: { text: string; accounts: number }[];
}

export interface Narrative {
  id: string;
  name: string;
  type: NarrativeType;
  volume: number;
  neg: number;
  pos: number;
  velocity: number;
  acceleration: number;
  projection: number;
  status: NarrativeStatus;
  reach: number;
  emotions: string[];
  origin: string;
  claims: string[];
  platformShare: Partial<Record<PlatformKey, number>>;
  geo: string;
  series: number[];
  handles: Account[];
  posts: Post[];
  authenticity: number | null;
  coordinationNote: string;
  cluster: Cluster | null;
  contagion: ContagionHop[];
  spread: SpreadStats;
  amplifiers: Account[];
}

export interface Alert {
  id: string;
  title: string;
  narrative: string;
  severity: Severity;
  type: string;
  status: string;
  velocity: number;
  projection: string;
  neg: number;
  reach: number;
  platform: string;
  origin: string;
  authenticity: number;
  why: string;
  evidence: string[];
}

export interface Channel {
  key: PlatformKey;
  mentions: number;
  engagement: number;
  pos: number;
  neg: number;
  neu: number;
  /** Tone-only scoring (e.g. news) rather than per-comment sentiment. */
  toneOnly: boolean;
}

export interface Emotion {
  name: string;
  pct: number;
  tone: Tone;
}

export interface GeoRegion {
  name: string;
  share: number;
  neg: number;
  note: string;
}

export interface Language {
  name: string;
  share: number;
  neg: number;
}

export interface HistoryPoint {
  index: number;
  date: string;
  value: number;
}

export interface DailyPoint {
  index: number;
  date: string;
  threat: number;
  volume: number;
}

export interface TimelineEvent {
  index: number;
  date: string;
  title: string;
  threat: number;
  note: string;
}

export interface Dashboard {
  topic: string;
  client: string;
  generatedAt: string;
  cadenceHours: number;
  nextRefresh: string;
  current: CurrentSnapshot;
  cycles: Cycle[];
  narratives: Narrative[];
  alerts: Alert[];
  channels: Record<PlatformKey, Channel>;
  emotions: Emotion[];
  geo: GeoRegion[];
  languages: Language[];
  history: { start: string; end: string; daily: DailyPoint[]; events: TimelineEvent[] };
}
