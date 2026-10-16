import { Fragment, useEffect, useState, type CSSProperties, type KeyboardEvent } from 'react';
import { Sparkline } from '@/components/charts/Sparkline';
import { Checkbox, IconButton, Pill } from '@/components/ui/controls';
import { compact, signed } from '@/lib/format';
import { statusTone, toneVar } from '@/lib/threat';
import type { Bucket, PendingNarrative } from '@/store/tracking.store';
import type { Narrative } from '@/types/domain';
import { pendingEta, type SortKey } from './filtering';
import s from './narratives.module.css';

export interface Group {
  key: string;
  label: string;
  color: string | null;
  rows: Narrative[];
}

interface Props {
  groups: Group[];
  pending: PendingNarrative[];
  bucketOf: (name: string) => Bucket | undefined;
  selected: ReadonlySet<string>;
  onToggle: (name: string, on: boolean) => void;
  onToggleAll: (on: boolean) => void;
  sort: SortKey;
  onSort: (k: SortKey) => void;
  onOpen: (n: Narrative) => void;
  onDelete: (name: string, pending: boolean) => void;
  onPendingClick: (name: string) => void;
}

const COLS = 9;

export function NarrativeTable(p: Props) {
  const all = p.groups.flatMap((g) => g.rows);
  const allOn = all.length > 0 && all.every((n) => p.selected.has(n.name));
  const someOn = !allOn && all.some((n) => p.selected.has(n.name));
  const now = useNow();
  const empty = all.length === 0 && p.pending.length === 0;

  return (
    <div className={s.tableWrap}>
      <table className={s.table}>
        <thead>
          <tr>
            <th className={s.colCheck}>
              <Checkbox
                checked={allOn}
                ref={(el) => {
                  if (el) el.indeterminate = someOn;
                }}
                onChange={(e) => p.onToggleAll(e.target.checked)}
                aria-label="Select all visible narratives"
              />
            </th>
            <th>Narrative</th>
            <SortTh label="Volume" k="vol" {...p} />
            <SortTh label="Velocity" k="vel" {...p} />
            <th>7-day trend</th>
            <SortTh label="Negative" k="neg" {...p} />
            <SortTh label="24h proj." k="proj" {...p} />
            <th>Status</th>
            <th className={s.colAct}>
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {p.pending.map((x) => (
            <tr
              key={`p-${x.name}`}
              className={`${s.row} ${s.pendingRow}`}
              tabIndex={0}
              onClick={() => p.onPendingClick(x.name)}
              onKeyDown={(e) => e.key === 'Enter' && p.onPendingClick(x.name)}
            >
              <td className={s.colCheck} />
              <td>
                <div className={s.nameCell}>
                  <span className={s.name}>{x.name}</span>
                  <span className={s.typeLine}>
                    <span className={s.scanDot} /> Collecting first cycle
                  </span>
                </div>
              </td>
              <td colSpan={5} className={s.dim}>
                <span className={s.shimmer} />
              </td>
              <td>
                <Pill tone="acc">data in {pendingEta(x.addedAt, now)}</Pill>
              </td>
              <td className={s.colAct}>
                <IconButton
                  bare
                  icon="trash"
                  size={15}
                  label={`Stop tracking ${x.name}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    p.onDelete(x.name, true);
                  }}
                />
              </td>
            </tr>
          ))}

          {p.groups.map((g) => (
            <Fragment key={g.key}>
              {g.label && (
                <tr className={s.groupRow}>
                  <td />
                  <td colSpan={COLS - 1}>
                    {g.color && <span className={s.groupDot} style={{ background: g.color }} />}
                    {g.label} <span className={s.groupCount}>· {g.rows.length}</span>
                  </td>
                </tr>
              )}
              {g.rows.map((n) => (
                <Row key={n.id} n={n} {...p} />
              ))}
            </Fragment>
          ))}

          {empty && (
            <tr>
              <td colSpan={COLS} className={s.empty}>
                No narratives match these filters.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function Row({ n, selected, onToggle, onOpen, onDelete, bucketOf }: { n: Narrative } & Props) {
  const tone = statusTone[n.status];
  const bucket = bucketOf(n.name);
  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && e.target === e.currentTarget) onOpen(n);
  };
  return (
    <tr className={s.row} tabIndex={0} onClick={() => onOpen(n)} onKeyDown={onKey} style={{ '--st': toneVar(tone) } as CSSProperties} aria-label={`Open ${n.name}`}>
      <td className={s.colCheck} onClick={(e) => e.stopPropagation()}>
        <Checkbox checked={selected.has(n.name)} onChange={(e) => onToggle(n.name, e.target.checked)} aria-label={`Select ${n.name}`} />
      </td>
      <td>
        <div className={s.nameCell}>
          <span className={s.name}>{n.name}</span>
          <span className={s.typeLine}>
            {n.type}
            {bucket && (
              <span className={s.bucketTag} style={{ '--c': bucket.color } as CSSProperties}>
                {bucket.name}
              </span>
            )}
          </span>
        </div>
      </td>
      <td className="num">{compact(n.volume)}</td>
      <td className="num">
        {n.velocity}/hr{' '}
        <span style={{ color: n.acceleration > 0 ? 'var(--neg)' : 'var(--pos)' }} aria-label={n.acceleration > 0 ? 'accelerating' : 'slowing'}>
          {n.acceleration > 0 ? '▲' : '▼'}
        </span>
      </td>
      <td>
        <Sparkline values={n.series} width={92} height={26} color={toneVar(tone)} label={`${n.name} volume trend`} />
      </td>
      <td>
        <div className={s.negCell}>
          <span className="num">{n.neg}%</span>
          <span className={s.negTrack}>
            <i style={{ width: `${n.neg}%` }} />
          </span>
        </div>
      </td>
      <td className="num" style={{ color: n.projection > 0 ? 'var(--neg)' : 'var(--pos)', fontWeight: 650 }}>
        {signed(n.projection)}
      </td>
      <td>
        <Pill tone={tone} dot>
          {n.status}
        </Pill>
      </td>
      <td className={s.colAct}>
        <IconButton
          bare
          icon="trash"
          size={15}
          label={`Stop tracking ${n.name}`}
          onClick={(e) => {
            e.stopPropagation();
            onDelete(n.name, false);
          }}
        />
      </td>
    </tr>
  );
}

function SortTh({ label, k, sort, onSort }: { label: string; k: SortKey; sort: SortKey; onSort: (k: SortKey) => void }) {
  const on = sort === k;
  return (
    <th aria-sort={on ? 'descending' : 'none'}>
      <button type="button" className={`${s.sortBtn} ${on ? s.sortOn : ''}`} onClick={() => onSort(k)}>
        {label}
        <span aria-hidden="true">{on ? '↓' : '↕'}</span>
      </button>
    </th>
  );
}

/** Minute ticker so pending ETAs count down. */
function useNow() {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);
  return now;
}
