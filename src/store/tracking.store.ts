import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { cleanInput } from '@/lib/sanitize';

export interface PendingNarrative {
  name: string;
  addedAt: number;
}

export interface Bucket {
  id: string;
  name: string;
  color: string;
}

/** Bucket colours — distinct from semantic status tones. */
export const BUCKET_PALETTE = ['#F43C7B', '#56B6FF', '#37D58C', '#FF8A3D', '#9B8BFF', '#F5B52A'] as const;

const MAX_ITEMS = 200;

interface TrackingState {
  removed: string[];
  pending: PendingNarrative[];
  buckets: Bucket[];
  /** narrative name → bucket id */
  membership: Record<string, string>;

  removeNarrative: (name: string) => void;
  addPending: (rawName: string, existing: string[]) => { ok: boolean; name: string };
  removePending: (name: string) => void;
  createBucket: (rawName: string, members: string[]) => { ok: boolean; reason?: string; name: string };
  assignToBucket: (bucketId: string, members: string[]) => void;
  unassign: (members: string[]) => void;
  deleteBucket: (id: string) => void;
}

const same = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();

export const useTrackingStore = create<TrackingState>()(
  persist(
    (set, get) => ({
      removed: [],
      pending: [],
      buckets: [],
      membership: {},

      removeNarrative: (name) => set((s) => ({ removed: [...new Set([...s.removed, name])].slice(-MAX_ITEMS) })),

      addPending: (rawName, existing) => {
        const name = cleanInput(rawName, 80);
        if (!name) return { ok: false, name };
        const exists = get().pending.some((p) => same(p.name, name)) || existing.some((e) => same(e, name));
        if (exists) return { ok: false, name };
        set((s) => ({ pending: [{ name, addedAt: Date.now() }, ...s.pending].slice(0, MAX_ITEMS) }));
        return { ok: true, name };
      },

      removePending: (name) => set((s) => ({ pending: s.pending.filter((p) => p.name !== name) })),

      createBucket: (rawName, members) => {
        const name = cleanInput(rawName, 40);
        if (!name) return { ok: false, reason: 'Name the bucket first.', name };
        const { buckets } = get();
        if (buckets.some((b) => same(b.name, name))) return { ok: false, reason: 'A bucket with that name already exists.', name };
        const used = new Set(buckets.map((b) => b.color));
        const color = BUCKET_PALETTE.find((c) => !used.has(c)) ?? BUCKET_PALETTE[buckets.length % BUCKET_PALETTE.length]!;
        const bucket: Bucket = { id: `b${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`, name, color };
        set((s) => ({
          buckets: [bucket, ...s.buckets],
          membership: { ...s.membership, ...Object.fromEntries(members.map((m) => [m, bucket.id])) },
        }));
        return { ok: true, name };
      },

      assignToBucket: (bucketId, members) =>
        set((s) =>
          s.buckets.some((b) => b.id === bucketId)
            ? { membership: { ...s.membership, ...Object.fromEntries(members.map((m) => [m, bucketId])) } }
            : s,
        ),

      unassign: (members) =>
        set((s) => {
          const membership = { ...s.membership };
          for (const m of members) delete membership[m];
          return { membership };
        }),

      deleteBucket: (id) =>
        set((s) => ({
          buckets: s.buckets.filter((b) => b.id !== id),
          membership: Object.fromEntries(Object.entries(s.membership).filter(([, v]) => v !== id)),
        })),
    }),
    {
      name: 'rdr.tracking',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: ({ removed, pending, buckets, membership }) => ({ removed, pending, buckets, membership }),
      // Never trust persisted data: keep only well-formed entries.
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<TrackingState>;
        const str = (v: unknown): v is string => typeof v === 'string' && v.length <= 120;
        const buckets = Array.isArray(p.buckets)
          ? p.buckets.filter(
              (b): b is Bucket =>
                !!b && str(b.id) && str(b.name) && typeof b.color === 'string' && /^#[0-9a-f]{6}$/i.test(b.color),
            )
          : [];
        const ids = new Set(buckets.map((b) => b.id));
        return {
          ...current,
          removed: Array.isArray(p.removed) ? p.removed.filter(str).slice(-MAX_ITEMS) : [],
          pending: Array.isArray(p.pending)
            ? p.pending.filter((x): x is PendingNarrative => !!x && str(x.name) && Number.isFinite(x.addedAt)).slice(0, MAX_ITEMS)
            : [],
          buckets,
          membership:
            p.membership && typeof p.membership === 'object'
              ? Object.fromEntries(Object.entries(p.membership).filter(([k, v]) => str(k) && str(v) && ids.has(v)))
              : {},
        };
      },
    },
  ),
);
