import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { Narrative, NarrativeStatus, NarrativeType } from '@/types/domain';

export const TYPE_OPTIONS = [
  { value: 'all', label: 'All types' },
  { value: 'Organic critique', label: 'Organic critique' },
  { value: 'Inauthentic / coordinated', label: 'Inauthentic / coordinated' },
  { value: 'Positive / advocacy', label: 'Positive / advocacy' },
  { value: 'Mixed', label: 'Mixed' },
] as const satisfies readonly { value: NarrativeType | 'all'; label: string }[];

export const STATUS_OPTIONS = [
  { value: 'all', label: 'All status' },
  { value: 'Critical', label: 'Critical' },
  { value: 'Escalating', label: 'Escalating' },
  { value: 'Rising', label: 'Rising' },
  { value: 'Steady', label: 'Steady' },
  { value: 'Cooling', label: 'Cooling' },
] as const satisfies readonly { value: NarrativeStatus | 'all'; label: string }[];

export const LEAN_OPTIONS = [
  { value: 'all', label: 'All sentiment' },
  { value: 'neg', label: 'Negative-led' },
  { value: 'pos', label: 'Positive-led' },
] as const;

export const SORT_OPTIONS = [
  { value: 'vol', label: 'Sort: Volume' },
  { value: 'vel', label: 'Sort: Velocity' },
  { value: 'proj', label: 'Sort: 24h projection' },
  { value: 'neg', label: 'Sort: Negative %' },
] as const;

export type TypeFilter = (typeof TYPE_OPTIONS)[number]['value'];
export type StatusFilter = (typeof STATUS_OPTIONS)[number]['value'];
export type LeanFilter = (typeof LEAN_OPTIONS)[number]['value'];
export type SortKey = (typeof SORT_OPTIONS)[number]['value'];

export interface NarrativeFilters {
  type: TypeFilter;
  status: StatusFilter;
  lean: LeanFilter;
  sort: SortKey;
  q: string;
}

const DEFAULTS: NarrativeFilters = { type: 'all', status: 'all', lean: 'all', sort: 'vol', q: '' };

function pick<T extends string>(raw: string | null, opts: readonly { value: T }[], fallback: T): T {
  return opts.some((o) => o.value === raw) ? (raw as T) : fallback;
}

/** Filters live in the URL so a filtered view can be bookmarked or shared. */
export function useNarrativeFilters() {
  const [params, setParams] = useSearchParams();

  const filters: NarrativeFilters = useMemo(
    () => ({
      type: pick(params.get('type'), TYPE_OPTIONS, DEFAULTS.type),
      status: pick(params.get('status'), STATUS_OPTIONS, DEFAULTS.status),
      lean: pick(params.get('lean'), LEAN_OPTIONS, DEFAULTS.lean),
      sort: pick(params.get('sort'), SORT_OPTIONS, DEFAULTS.sort),
      q: (params.get('q') ?? '').slice(0, 80),
    }),
    [params],
  );

  const update = useCallback(
    (patch: Partial<NarrativeFilters>) =>
      setParams(
        (p) => {
          for (const [k, v] of Object.entries(patch)) {
            if (v === undefined || v === '' || v === DEFAULTS[k as keyof NarrativeFilters]) p.delete(k);
            else p.set(k, String(v));
          }
          return p;
        },
        { replace: true },
      ),
    [setParams],
  );

  const reset = useCallback(() => update({ ...DEFAULTS }), [update]);
  const isDefault = (Object.keys(DEFAULTS) as (keyof NarrativeFilters)[]).every((k) => filters[k] === DEFAULTS[k]);

  return { filters, update, reset, isDefault };
}

const SORTERS: Record<SortKey, (n: Narrative) => number> = {
  vol: (n) => n.volume,
  vel: (n) => n.velocity,
  proj: (n) => n.projection,
  neg: (n) => n.neg,
};

export function applyFilters(list: Narrative[], f: NarrativeFilters): Narrative[] {
  const q = f.q.toLowerCase().trim();
  return list
    .filter((n) => f.type === 'all' || n.type === f.type)
    .filter((n) => f.status === 'all' || n.status === f.status)
    .filter((n) => (f.lean === 'neg' ? n.neg >= 50 : f.lean === 'pos' ? n.pos > n.neg : true))
    .filter((n) => !q || n.name.toLowerCase().includes(q))
    .sort((a, b) => SORTERS[f.sort](b) - SORTERS[f.sort](a));
}

export function pendingEta(addedAt: number, now = Date.now()): string {
  const mins = Math.max(1, 60 - Math.floor((now - addedAt) / 60_000));
  return mins >= 60 ? '~1h' : `~${mins}m`;
}
