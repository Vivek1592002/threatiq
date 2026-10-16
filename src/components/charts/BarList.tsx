import { motion } from 'motion/react';
import type { CSSProperties, ReactNode } from 'react';
import s from './charts.module.css';

export interface BarRow {
  key: string;
  label: ReactNode;
  sub?: ReactNode;
  icon?: ReactNode;
  value: number;
  color: string;
  valueLabel?: ReactNode;
}

interface Props {
  rows: BarRow[];
  /** scale max; defaults to the largest value */
  max?: number;
  ariaLabel?: string;
}

/** Horizontal ranked bars with animated fill. */
export function BarList({ rows, max, ariaLabel }: Props) {
  const top = max ?? Math.max(1, ...rows.map((r) => r.value));
  return (
    <ul className={s.bars} aria-label={ariaLabel} style={{ listStyle: 'none', margin: 0, padding: 0 }}>
      {rows.map((r, i) => (
        <li key={r.key} className={s.barRow} style={{ '--c': r.color } as CSSProperties}>
          <span className={s.barLabel}>
            {r.icon}
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.label}</span>
            {r.sub && <span className={s.barSub}>{r.sub}</span>}
          </span>
          <span className={s.barTrack} aria-hidden="true">
            <motion.i
              className={s.barFill}
              initial={{ width: 0 }}
              animate={{ width: `${(100 * r.value) / top}%` }}
              transition={{ duration: 0.8, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
            />
          </span>
          <span className={`${s.barValue} num`}>{r.valueLabel ?? `${r.value}%`}</span>
        </li>
      ))}
    </ul>
  );
}
