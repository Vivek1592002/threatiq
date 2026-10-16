import { useMemo, useState, type CSSProperties, type PointerEvent, type ReactNode } from 'react';
import { scaleLinear } from 'd3-scale';
import { curveMonotoneX, line } from 'd3-shape';
import { useElementSize } from '@/hooks/useElementSize';
import { ChartTooltip, TipTitle } from './ChartTooltip';
import type { XTick } from './TimeSeriesChart';
import { thinTicks } from './axis';
import s from './charts.module.css';

export interface LineSeries {
  key: string;
  label: string;
  color: string;
  values: number[];
  emphasis?: boolean;
  icon?: ReactNode;
}

interface Props {
  series: LineSeries[];
  /** keys currently visible */
  visible: ReadonlySet<string>;
  onToggle: (key: string) => void;
  xTicks: XTick[];
  xLabel: (i: number) => string;
  yFormat?: (v: number) => string;
  height?: number;
  ariaLabel: string;
}

const M = { t: 12, r: 14, b: 26, l: 46 };

/** Multi-series line chart with toggleable legend and a shared crosshair. */
export function MultiLineChart({ series, visible, onToggle, xTicks, xLabel, yFormat = String, height = 210, ariaLabel }: Props) {
  const [ref, { width }] = useElementSize<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);
  const W = Math.max(280, width);
  const H = height;
  const shown = series.filter((sr) => visible.has(sr.key));
  const n = series[0]?.values.length ?? 0;

  const { x, y, paths } = useMemo(() => {
    const x = scaleLinear().domain([0, Math.max(1, n - 1)]).range([M.l, W - M.r]);
    const max = Math.max(1, ...shown.flatMap((sr) => sr.values));
    const y = scaleLinear().domain([0, max * 1.08]).range([H - M.b, M.t]).nice(4);
    const ln = line<number>().x((_, i) => x(i)).y((d) => y(d)).curve(curveMonotoneX);
    return { x, y, paths: shown.map((sr) => ({ ...sr, d: ln(sr.values) ?? '' })) };
  }, [shown, n, W, H]);

  const onMove = (e: PointerEvent<SVGRectElement>) => {
    const box = e.currentTarget.getBoundingClientRect();
    const px = ((e.clientX - box.left) / box.width) * (W - M.l - M.r) + M.l;
    setHover(Math.max(0, Math.min(n - 1, Math.round(x.invert(px)))));
  };

  return (
    <div>
      <div className={s.legend} role="group" aria-label="Toggle series">
        {series.map((sr) => (
          <button
            key={sr.key}
            type="button"
            className={s.legendBtn}
            aria-pressed={visible.has(sr.key)}
            onClick={() => onToggle(sr.key)}
            style={{ '--c': sr.color } as CSSProperties}
          >
            {sr.icon ?? <span className={s.legendSwatch} />}
            {sr.label}
          </button>
        ))}
      </div>
      <div ref={ref} className={s.wrap}>
        <svg className={s.svg} width={W} height={H} viewBox={`0 0 ${W} ${H}`} role="img" aria-label={ariaLabel}>
          {y.ticks(4).map((t) => (
            <g key={t}>
              <line className={s.grid} x1={M.l} x2={W - M.r} y1={y(t)} y2={y(t)} strokeDasharray="2 4" />
              <text className={s.axis} x={M.l - 8} y={y(t) + 3} textAnchor="end">
                {yFormat(t)}
              </text>
            </g>
          ))}
          {thinTicks(xTicks, x).map((t) => (
            <text key={t.at} className={s.axis} x={x(t.at)} y={H - 7} textAnchor="middle">
              {t.label}
            </text>
          ))}
          {paths.map((p) => (
            <g key={p.key}>
              <path d={p.d} fill="none" style={{ stroke: p.color }} strokeWidth={p.emphasis ? 2.8 : 1.8} opacity={p.emphasis ? 1 : 0.9} strokeLinejoin="round" />
              <circle cx={x(n - 1)} cy={y(p.values[n - 1] ?? 0)} r={p.emphasis ? 3.6 : 2.8} style={{ fill: p.color }} />
            </g>
          ))}
          {hover != null && (
            <g pointerEvents="none">
              <line x1={x(hover)} x2={x(hover)} y1={M.t} y2={H - M.b} style={{ stroke: 'var(--ink-3)' }} strokeDasharray="3 3" />
              {paths.map((p) => (
                <circle key={p.key} cx={x(hover)} cy={y(p.values[hover] ?? 0)} r={4} style={{ fill: p.color, stroke: 'var(--canvas)' }} strokeWidth={1.5} />
              ))}
            </g>
          )}
          <rect
            x={M.l}
            y={M.t}
            width={Math.max(1, W - M.l - M.r)}
            height={H - M.t - M.b}
            fill="transparent"
            style={{ cursor: 'crosshair' }}
            onPointerMove={onMove}
            onPointerDown={onMove}
            onPointerLeave={() => setHover(null)}
          />
        </svg>
        {hover != null && paths.length > 0 && (
          <ChartTooltip x={x(hover)} y={M.t + 4} bound={W} below>
            <TipTitle>{xLabel(hover)}</TipTitle>
            {[...paths]
              .sort((a, b) => (b.values[hover] ?? 0) - (a.values[hover] ?? 0))
              .map((p) => (
                <div key={p.key} className={s.tipRow}>
                  <span>
                    <span className={s.tipSwatch} style={{ background: p.color }} />
                    {p.label}
                  </span>
                  <b className="num" style={{ color: 'var(--ink)' }}>
                    {yFormat(p.values[hover] ?? 0)}
                  </b>
                </div>
              ))}
          </ChartTooltip>
        )}
      </div>
    </div>
  );
}
