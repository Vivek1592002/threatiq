/**
 * Wire format of the dashboard payload as produced by the collection pipeline.
 * Kept separate from the domain model so backend changes stay contained in
 * `services/normalize.ts`.
 */

export interface RawAccount {
  h: string;
  p: string;
  reach: number;
  foll?: number;
  stance?: string;
  auth?: number | null;
  burst?: boolean;
}

export interface RawNarrative {
  name: string;
  type: string;
  vol: number;
  neg: number;
  pos: number;
  vel: number;
  accel: number;
  proj: number;
  status: string;
  reach: number;
  emo: string[];
  origin: string;
  claims: string[];
  plat: Record<string, number>;
  geo: string;
  amps: string[];
  series: number[];
  handles: RawAccount[];
  posts: { h: string; p: string; url: string; text: string; likes: number }[];
  auth?: number | null;
  coord?: string;
  cluster?: {
    name: string;
    accounts: number;
    age: number;
    dup: number;
    bursts: number;
    verdict: string;
    reach: number;
  } | null;
  contagion: { t: string; plat: string; note: string; vol: number }[];
  spread?: {
    totalAccounts: number;
    botAccounts: number;
    botPct: number;
    copypasta: { text: string; accounts: number }[];
  };
  amplifiers?: RawAccount[];
}

export interface RawDashboard {
  topic: string;
  client: string;
  generated: string;
  cadence_h: number;
  next_refresh: string;
  current: {
    threat: number;
    dThreat: number;
    vol: number;
    dVol: number;
    pos: number;
    neg: number;
    neu: number;
    reach: number;
    total_n: number;
    total_eng: number;
    scored_n: number;
    window: string;
  };
  cycles: {
    i: number;
    ts: string;
    label: string;
    threat: number;
    vol: number;
    neg: number;
    pos: number;
    neu: number;
    reach: number;
    alerts?: number;
  }[];
  /** [name, pct, colour] */
  emotions: [string, number, string][];
  /** [region, volume share %, negative %, note] */
  geo: [string, number, number, string][];
  /** [language, volume share %, negative %, colour] */
  langs: [string, number, number, string][];
  narratives: RawNarrative[];
  alerts: {
    id: string;
    title: string;
    narrative: string;
    sev: string;
    type: string;
    status: string;
    vel: number;
    proj: string;
    neg: number;
    reach: number;
    plat: string;
    origin: string;
    auth: number;
    why: string;
    evidence: string[];
  }[];
  channels: Record<string, { n: number; eng: number; pos: number; neg: number; neu: number; tone: boolean }>;
  history: {
    start: string;
    end: string;
    overall: { i: number; date: string; t: number; v: number }[];
    events: { i: number; date: string; title: string; t: number; note: string }[];
  };
}
