import { useMemo, useState } from 'react';
import { scaleLinear, scalePoint } from 'd3-scale';
import { area, curveMonotoneX, line } from 'd3-shape';
import { useElementSize } from '@/hooks/useElementSize';
import { useSvgId } from '@/hooks/useSvgId';
import { compact } from '@/lib/format';
import type { ContagionHop } from '@/types/domain';
import { ChartTooltip, TipNote, TipTitle, TipValue } from './ChartTooltip';
import s from './charts.module.css';

const PLATFORM_COLOR: Record<string, string> = {
  youtube: 'var(--youtube)',
  instagram: 'var(--instagram)',
  x: 'var(--x)',
  twitter: 'var(--x)',
  news: 'var(--news)',
};

const colorFor = (plat: string) => PLATFORM_COLOR[plat.toLowerCase()] ?? 'var(--acc)';

const M = { t: 18, r: 24, b: 46, l: 46 };

/** Origin → spread timeline: volume per hop, nodes coloured by platform. */
export function ContagionChart({ hops, height = 230 }: { hops: ContagionHop[]; height?: number }) {
  const uid = useSvgId('cg');
  const [ref, { width }] = useElementSize<HTMLDivElement>(560);
  const [active, setActive] = useState<number | null>(null);
  const W = Math.max(260, width);
  const H = height;

  const { x, y, linePath, areaPath } = useMemo(() => {
    const x = scalePoint<number>().domain(hops.map((_, i) => i)).range([M.l, W - M.r]);
    const max = Math.max(1, ...hops.map((h) => h.volume));
    const y = scaleLinear().domain([0, max * 1.14]).range([H - M.b, M.t]).nice(4);
    const px = (_: ContagionHop, i: number) => x(i) ?? 0;
    return {
      x,
      y,
      linePath: line<ContagionHop>().x(px).y((h) => y(h.volume)).curve(curveMonotoneX)(hops) ?? '',
      areaPath: area<ContagionHop>().x(px).y0(H - M.b).y1((h) => y(h.volume)).curve(curveMonotoneX)(hops) ?? '',
    };
  }, [hops, W, H]);

  if (!hops.length) return null;
  const act = active != null ? hops[active] : undefined;

  return (
    <div ref={ref} className={s.wrap}>
      <svg className={s.svg} width={W} height={H} viewBox={`0 0 ${W} ${H}`} role="img" aria-label="How the narrative originated and spread across platforms">
        <defs>
          <linearGradient id={uid} x1="0" y1="0" x2="1" y2="0">
            {hops.map((h, i) => (
              <stop key={i} offset={hops.length > 1 ? i / (hops.length - 1) : 0} style={{ stopColor: colorFor(h.platform) }} />
            ))}
          </linearGradient>
          <linearGradient id={`${uid}-f`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" style={{ stopColor: 'var(--acc)', stopOpacity: 0.22 }} />
            <stop offset="1" style={{ stopColor: 'var(--acc)', stopOpacity: 0 }} />
          </linearGradient>
        </defs>
        {y.ticks(4).map((t) => (
          <g key={t}>
            <line className={s.grid} x1={M.l} x2={W - M.r} y1={y(t)} y2={y(t)} strokeDasharray="2 4" />
            <text className={s.axis} x={M.l - 8} y={y(t) + 3} textAnchor="end">
              {compact(t)}
            </text>
          </g>
        ))}
        <path d={areaPath} fill={`url(#${uid}-f)`} />
        <path d={linePath} fill="none" stroke={`url(#${uid})`} strokeWidth={2.4} />
        {hops.map((h, i) => {
          const cx = x(i) ?? 0;
          const c = colorFor(h.platform);
          return (
            <g
              key={i}
              tabIndex={0}
              role="button"
              aria-label={`${h.t} on ${h.platform}: ${h.volume} mentions. ${h.note}`}
              onPointerEnter={() => setActive(i)}
              onPointerLeave={() => setActive(null)}
              onFocus={() => setActive(i)}
              onBlur={() => setActive(null)}
              style={{ cursor: 'pointer', outline: 'none' }}
            >
              <line x1={cx} x2={cx} y1={y(h.volume)} y2={H - M.b} style={{ stroke: c }} strokeDasharray="1 3" opacity={0.5} />
              {i === 0 && <circle cx={cx} cy={y(h.volume)} r={12} style={{ fill: c }} opacity={0.16} />}
              <circle cx={cx} cy={y(h.volume)} r={active === i ? 8 : 6} style={{ fill: c, stroke: 'var(--panel)', transition: 'r 140ms' }} strokeWidth={2.5} />
              <text x={cx} y={H - 26} textAnchor="middle" style={{ fill: 'var(--ink-2)', fontFamily: 'var(--f-mono)', fontSize: 10, fontWeight: 600 }}>
                {h.t}
              </text>
              <text x={cx} y={H - 11} textAnchor="middle" style={{ fill: c, fontSize: 10.5, fontWeight: 650 }}>
                {h.platform}
              </text>
            </g>
          );
        })}
      </svg>
      {act && active != null && (
        <ChartTooltip x={x(active) ?? 0} y={y(act.volume)} bound={W} below={y(act.volume) < 100}>
          <TipTitle>
            {active === 0 ? 'Origin · ' : ''}
            {act.platform} · {act.t}
          </TipTitle>
          <TipValue>
            <b className="num">{compact(act.volume)}</b>mentions
          </TipValue>
          <TipNote>{act.note}</TipNote>
        </ChartTooltip>
      )}
    </div>
  );
}
