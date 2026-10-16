import { useMemo, useState, type KeyboardEvent, type PointerEvent, type ReactNode } from 'react';
import { scaleLinear } from 'd3-scale';
import { area, curveMonotoneX, line } from 'd3-shape';
import { useElementSize } from '@/hooks/useElementSize';
import { useSvgId } from '@/hooks/useSvgId';
import { THREAT_BANDS, gaugeZoneOf, toneVar } from '@/lib/threat';
import { ChartTooltip } from './ChartTooltip';
import { thinTicks } from './axis';
import s from './charts.module.css';

export interface SeriesPoint {
  value: number;
}

export interface ChartMarker {
  /** position in `data` */
  at: number;
  title: string;
}

export interface XTick {
  at: number;
  label: string;
}

interface Props<T extends SeriesPoint> {
  data: T[];
  height?: number;
  ariaLabel: string;
  /** 'threat' → zone bands + zone-coloured line, fixed 0-100 semantics */
  variant?: 'threat' | 'volume';
  /** CSS colour for the volume variant */
  color?: string;
  xTicks: XTick[];
  yFormat?: (v: number) => string;
  markers?: ChartMarker[];
  renderTooltip: (d: T, index: number, marker: ChartMarker | undefined) => ReactNode;
  /** y-domain floor at zero (volume) or padded around data (threat) */
}

const M = { t: 14, r: 14, b: 26, l: 40 };

export function TimeSeriesChart<T extends SeriesPoint>({
  data,
  height = 220,
  ariaLabel,
  variant = 'threat',
  color = 'var(--acc)',
  xTicks,
  yFormat = (v) => String(v),
  markers = [],
  renderTooltip,
}: Props<T>) {
  const uid = useSvgId('ts');
  const [ref, { width }] = useElementSize<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);
  const W = Math.max(280, width);
  const H = height;
  const isThreat = variant === 'threat';

  const { x, y, linePath, areaPath, yTicks } = useMemo(() => {
    const vals = data.map((d) => d.value);
    const lo = Math.min(...vals);
    const hi = Math.max(...vals);
    const x = scaleLinear().domain([0, Math.max(1, data.length - 1)]).range([M.l, W - M.r]);
    const y = isThreat
      ? scaleLinear().domain([Math.max(0, lo - 6), Math.min(100, hi + 6)]).range([H - M.b, M.t])
      : scaleLinear().domain([0, (hi || 1) * 1.12]).range([H - M.b, M.t]).nice(4);
    const ln = line<T>().x((_, i) => x(i)).y((d) => y(d.value)).curve(curveMonotoneX);
    const ar = area<T>().x((_, i) => x(i)).y0(H - M.b).y1((d) => y(d.value)).curve(curveMonotoneX);
    const yTicks = isThreat ? [25, 50, 75].filter((t) => t >= y.domain()[0]! && t <= y.domain()[1]!) : y.ticks(4);
    return { x, y, linePath: ln(data) ?? '', areaPath: ar(data) ?? '', yTicks };
  }, [data, W, H, isThreat]);

  const markerAt = useMemo(() => new Map(markers.map((m) => [m.at, m])), [markers]);

  // Zone gradient for the threat line: colour changes exactly at band thresholds.
  const zoneStops = useMemo(() => {
    if (!isThreat) return [];
    const [d0, d1] = y.domain() as [number, number];
    const toOffset = (v: number) => (d1 - v) / (d1 - d0);
    const stops: { offset: number; color: string }[] = [];
    for (const [a, b, tone] of [...THREAT_BANDS].reverse()) {
      if (b < d0 || a > d1) continue;
      stops.push({ offset: Math.max(0, toOffset(Math.min(b, d1))), color: toneVar(tone) });
      stops.push({ offset: Math.min(1, toOffset(Math.max(a, d0))), color: toneVar(tone) });
    }
    return stops;
  }, [isThreat, y]);

  const onMove = (e: PointerEvent<SVGRectElement>) => {
    const box = e.currentTarget.getBoundingClientRect();
    const px = ((e.clientX - box.left) / box.width) * (W - M.l - M.r) + M.l;
    setHover(Math.max(0, Math.min(data.length - 1, Math.round(x.invert(px)))));
  };

  const onKey = (e: KeyboardEvent<SVGSVGElement>) => {
    const step = e.shiftKey ? 10 : 1;
    if (e.key === 'ArrowRight') setHover((h) => Math.min(data.length - 1, (h ?? data.length - 1) + step));
    else if (e.key === 'ArrowLeft') setHover((h) => Math.max(0, (h ?? data.length - 1) - step));
    else if (e.key === 'Home') setHover(0);
    else if (e.key === 'End') setHover(data.length - 1);
    else return;
    e.preventDefault();
  };

  const last = data.length - 1;
  const hv = hover != null ? data[hover] : undefined;
  const strokeColor = isThreat ? `url(#${uid}-zone)` : color;
  const pointColor = (v: number) => (isThreat ? toneVar(gaugeZoneOf(v).tone) : color);

  return (
    <div ref={ref} className={s.wrap}>
      <svg
        className={s.svg}
        width={W}
        height={H}
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={ariaLabel}
        tabIndex={0}
        onKeyDown={onKey}
        onBlur={() => setHover(null)}
      >
        <defs>
          <linearGradient id={`${uid}-fill`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" style={{ stopColor: isThreat ? 'var(--acc)' : color, stopOpacity: isThreat ? 0.22 : 0.3 }} />
            <stop offset="100%" style={{ stopColor: isThreat ? 'var(--acc)' : color, stopOpacity: 0 }} />
          </linearGradient>
          {isThreat && (
            <linearGradient id={`${uid}-zone`} gradientUnits="userSpaceOnUse" x1="0" y1={M.t} x2="0" y2={H - M.b}>
              {zoneStops.map((st, i) => (
                <stop key={i} offset={st.offset} style={{ stopColor: st.color }} />
              ))}
            </linearGradient>
          )}
          <filter id={`${uid}-glow`} x="-10%" y="-30%" width="120%" height="160%">
            <feGaussianBlur stdDeviation="3" />
          </filter>
        </defs>

        {/* zone bands */}
        {isThreat &&
          THREAT_BANDS.map(([a, b, tone]) => {
            const [d0, d1] = y.domain() as [number, number];
            if (b < d0 || a > d1) return null;
            const yTop = y(Math.min(b, d1));
            const yBot = y(Math.max(a, d0));
            return <rect key={tone} x={M.l} width={W - M.l - M.r} y={yTop} height={Math.max(0, yBot - yTop)} style={{ fill: toneVar(tone) }} opacity={0.05} />;
          })}

        {yTicks.map((t) => (
          <g key={t}>
            <line className={s.grid} x1={M.l} x2={W - M.r} y1={y(t)} y2={y(t)} strokeDasharray="2 4" />
            <text className={s.axis} x={M.l - 8} y={y(t) + 3} textAnchor="end">
              {yFormat(t)}
            </text>
          </g>
        ))}
        {thinTicks(xTicks, x).map((t) => (
          <text key={`${t.at}-${t.label}`} className={s.axis} x={x(t.at)} y={H - 7} textAnchor="middle">
            {t.label}
          </text>
        ))}

        <path d={areaPath} fill={`url(#${uid}-fill)`} />
        <path d={linePath} fill="none" style={{ stroke: strokeColor }} strokeWidth={5} opacity={0.18} filter={`url(#${uid}-glow)`} />
        <path d={linePath} fill="none" style={{ stroke: strokeColor }} strokeWidth={2.2} strokeLinejoin="round" />

        {/* event markers */}
        {markers.map((m) => {
          const d = data[m.at];
          if (!d) return null;
          const c = pointColor(d.value);
          return (
            <g key={m.at} pointerEvents="none">
              <line x1={x(m.at)} x2={x(m.at)} y1={y(d.value) + 7} y2={H - M.b} style={{ stroke: c }} strokeWidth={1} strokeDasharray="1 3" opacity={0.6} />
              <rect
                x={x(m.at) - 4.5}
                y={y(d.value) - 4.5}
                width={9}
                height={9}
                rx={2}
                transform={`rotate(45 ${x(m.at)} ${y(d.value)})`}
                style={{ fill: c, stroke: 'var(--panel)' }}
                strokeWidth={2}
              />
            </g>
          );
        })}

        {/* live point */}
        {data[last] && (
          <g pointerEvents="none">
            <circle cx={x(last)} cy={y(data[last].value)} r={9} style={{ fill: pointColor(data[last].value) }} opacity={0.18}>
              <animate attributeName="r" values="5;12;5" dur="2.4s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.35;0;0.35" dur="2.4s" repeatCount="indefinite" />
            </circle>
            <circle cx={x(last)} cy={y(data[last].value)} r={4} style={{ fill: pointColor(data[last].value), stroke: 'var(--canvas)' }} strokeWidth={1.5} />
          </g>
        )}

        {/* crosshair */}
        {hv && hover != null && (
          <g pointerEvents="none">
            <line x1={x(hover)} x2={x(hover)} y1={M.t} y2={H - M.b} style={{ stroke: 'var(--ink-3)' }} strokeWidth={1} strokeDasharray="3 3" />
            <circle cx={x(hover)} cy={y(hv.value)} r={5} style={{ fill: pointColor(hv.value), stroke: 'var(--canvas)' }} strokeWidth={2} />
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

      {hv && hover != null && (
        <ChartTooltip x={x(hover)} y={y(hv.value)} bound={W} below={y(hv.value) < 90}>
          {renderTooltip(hv, hover, markerAt.get(hover))}
        </ChartTooltip>
      )}
    </div>
  );
}
