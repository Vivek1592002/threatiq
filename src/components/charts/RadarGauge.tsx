import { memo } from 'react';
import { useAnimatedNumber } from '@/hooks/useAnimatedNumber';
import { useSvgId } from '@/hooks/useSvgId';
import { GAUGE_BANDS, gaugeZoneOf, toneVar } from '@/lib/threat';
import type { Tone } from '@/types/domain';

interface Props {
  value: number;
  /** rendered width in px; height follows the 6:5 viewBox */
  size?: number;
  compact?: boolean;
  label?: string;
}

const VB_W = 240;
const VB_H = 200;
const CX = 120;
const CY = 116;
const R_OUT = 98;
const R_IN = 82;
const START = -135;
const SWEEP = 270;
const TICKS = 56;

const rad = (deg: number) => ((deg - 90) * Math.PI) / 180;
const polar = (r: number, deg: number) => [CX + r * Math.cos(rad(deg)), CY + r * Math.sin(rad(deg))] as const;
const angleOf = (v: number) => START + (Math.max(0, Math.min(100, v)) / 100) * SWEEP;

function toneAt(v: number): Tone {
  for (const [a, b, t] of GAUGE_BANDS) if (v >= a && v < b) return t;
  return 'fire';
}

function wedge(r: number, a0: number, a1: number) {
  const [x0, y0] = polar(r, a0);
  const [x1, y1] = polar(r, a1);
  return `M${CX},${CY} L${x0},${y0} A${r},${r} 0 0 1 ${x1},${y1} Z`;
}

/**
 * Radar-scope threat gauge: 270° segmented scale lit up to the value, a
 * trailing sweep beam that lands on the reading, and sonar rings behind.
 */
export const RadarGauge = memo(function RadarGauge({ value, size = 260, compact, label = 'Threat score' }: Props) {
  const uid = useSvgId('rg');
  const v = useAnimatedNumber(value);
  const shown = Math.round(v);
  const zone = gaugeZoneOf(value);
  const zoneColor = toneVar(zone.tone);
  const ang = angleOf(v);
  const hot = value >= 70;

  const ticks = Array.from({ length: TICKS + 1 }, (_, i) => {
    const tv = (i / TICKS) * 100;
    const a = angleOf(tv);
    const major = i % 14 === 0;
    const [x0, y0] = polar(major ? R_IN - 4 : R_IN, a);
    const [x1, y1] = polar(R_OUT, a);
    const lit = tv <= v + 0.01;
    return { i, x0, y0, x1, y1, lit, tone: toneAt(tv), major, near: lit && v - tv < 9 };
  });

  // trailing beam: thin slices fading out behind the reading
  const beam = Array.from({ length: 14 }, (_, i) => {
    const a1 = ang - i * 2.6;
    const a0 = a1 - 2.8;
    return { d: wedge(R_IN - 6, Math.max(START, a0), Math.max(START, a1)), o: 0.24 * Math.pow(1 - i / 14, 2) };
  }).filter((b) => b.o > 0.005);

  const [nx, ny] = polar(R_IN - 6, ang);
  const [bx, by] = polar(R_OUT + 1, ang);

  return (
    <svg
      width={size}
      height={(size * VB_H) / VB_W}
      viewBox={`0 0 ${VB_W} ${VB_H}`}
      role="img"
      aria-label={`${label}: ${value} out of 100, ${zone.word.toLowerCase()}`}
      style={{ display: 'block', overflow: 'visible' }}
    >
      <defs>
        <radialGradient id={`${uid}-core`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" style={{ stopColor: zoneColor, stopOpacity: 0.16 }} />
          <stop offset="70%" style={{ stopColor: zoneColor, stopOpacity: 0.02 }} />
          <stop offset="100%" style={{ stopColor: zoneColor, stopOpacity: 0 }} />
        </radialGradient>
        <filter id={`${uid}-glow`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2.4" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* scope background */}
      <circle cx={CX} cy={CY} r={R_IN - 6} fill={`url(#${uid}-core)`} />
      {[0.32, 0.56, 0.8].map((k) => (
        <circle key={k} cx={CX} cy={CY} r={(R_IN - 6) * k} fill="none" style={{ stroke: 'var(--hair-2)' }} strokeWidth={1} strokeDasharray={k === 0.8 ? '2 4' : undefined} />
      ))}
      {[START, 0, START + SWEEP].map((a) => {
        const [x, y] = polar(R_IN - 6, a);
        return <line key={a} x1={CX} y1={CY} x2={x} y2={y} style={{ stroke: 'var(--hair)' }} strokeWidth={1} />;
      })}

      {/* sweep beam */}
      {beam.map((b, i) => (
        <path key={i} d={b.d} style={{ fill: zoneColor }} opacity={b.o} />
      ))}
      <line x1={CX} y1={CY} x2={nx} y2={ny} style={{ stroke: zoneColor }} strokeWidth={2} strokeLinecap="round" filter={`url(#${uid}-glow)`} />

      {/* segmented scale */}
      {ticks.map((t) => (
        <line
          key={t.i}
          x1={t.x0}
          y1={t.y0}
          x2={t.x1}
          y2={t.y1}
          strokeWidth={t.major ? 3.2 : 2.6}
          strokeLinecap="round"
          style={{ stroke: t.lit ? toneVar(t.tone) : 'var(--hair-2)' }}
          opacity={t.lit ? (t.near ? 0.95 : 0.7) : 0.9}
          filter={t.near && hot ? `url(#${uid}-glow)` : undefined}
        />
      ))}

      {/* blip on the scale */}
      <circle cx={bx} cy={by} r={4.5} style={{ fill: 'var(--panel)', stroke: zoneColor }} strokeWidth={2.5} filter={`url(#${uid}-glow)`} />

      {/* scale labels */}
      {!compact &&
        [0, 25, 50, 75, 100].map((t) => {
          const [x, y] = polar(R_OUT + 13, angleOf(t));
          return (
            <text key={t} x={x} y={y + 3} textAnchor="middle" style={{ fill: 'var(--ink-3)', fontFamily: 'var(--f-mono)', fontSize: 9 }}>
              {t}
            </text>
          );
        })}

      <circle cx={CX} cy={CY} r={3} style={{ fill: zoneColor }} />

      {/* reading */}
      <text
        x={CX}
        y={CY + 46}
        textAnchor="middle"
        className="num"
        style={{ fill: 'var(--ink)', fontWeight: 650, fontSize: compact ? 34 : 40, letterSpacing: '-0.04em' }}
      >
        {shown}
      </text>
      <text
        x={CX}
        y={CY + 64}
        textAnchor="middle"
        style={{ fill: zoneColor, fontFamily: 'var(--f-mono)', fontWeight: 600, fontSize: 9.5, letterSpacing: '0.22em' }}
      >
        {zone.word}
      </text>
    </svg>
  );
});
