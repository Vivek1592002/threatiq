import type { CSSProperties } from 'react';
import { dayLabel } from '@/lib/format';
import type { HistStats } from '@/lib/analytics';
import s from './shared.module.css';

interface Props {
  stats: HistStats;
  format?: (n: number) => string;
  /** colour tokens for high / median / low */
  tones?: { hi: string; med: string; lo: string };
  /** scale used by range bars; defaults to the 365-day low/high */
  scale?: [number, number];
  medianHint?: string;
  /** 'threat' colours ranges green→red; 'neutral' uses the accent */
  variant?: 'threat' | 'neutral';
  layout?: 'stack' | 'row';
}

/** 365-day high / median / low plus rolling ranges drawn as range bars. */
export function HistoryStats({
  stats,
  format = String,
  tones = { hi: 'var(--neg)', med: 'var(--acc)', lo: 'var(--pos)' },
  scale,
  medianHint = 'typical reading',
  variant = 'threat',
  layout = 'stack',
}: Props) {
  const [min, max] = scale ?? [stats.lo, stats.hi];
  const pct = (v: number) => ((v - min) / Math.max(1, max - min)) * 100;

  return (
    <div className={`${s.hist} ${layout === 'row' ? s.histRow : ''}`}>
      <div className={s.histTriplet}>
        <Cell label="365-day high" value={format(stats.hi)} hint={dayLabel(stats.hiDate)} color={tones.hi} />
        <Cell label="Median" value={format(stats.median)} hint={medianHint} color={tones.med} />
        <Cell label="365-day low" value={format(stats.lo)} hint={dayLabel(stats.loDate)} color={tones.lo} />
      </div>
      <div className={s.ranges}>
        {stats.ranges.map((r) => (
          <div key={r.label} className={s.range}>
            <span className={s.rangeLabel}>{r.label}</span>
            <span className={s.rangeTrack} aria-hidden="true">
              <i
                className={`${s.rangeFill} ${variant === 'neutral' ? s.rangeNeutral : ''}`}
                style={{ left: `${pct(r.lo)}%`, width: `${Math.max(2, pct(r.hi) - pct(r.lo))}%` } as CSSProperties}
              />
            </span>
            <span className={`${s.rangeVal} num`}>
              <span style={{ color: tones.lo }}>{format(r.lo)}</span>
              <span className={s.rangeSep}>–</span>
              <span style={{ color: tones.hi }}>{format(r.hi)}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Cell({ label, value, hint, color }: { label: string; value: string; hint: string; color: string }) {
  return (
    <div className={s.cell}>
      <div className={s.cellLabel}>{label}</div>
      <div className={`${s.cellValue} num`} style={{ color }}>
        {value}
      </div>
      <div className={s.cellHint}>{hint}</div>
    </div>
  );
}
