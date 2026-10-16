import { memo } from 'react';
import { scaleLinear } from 'd3-scale';
import { area, curveMonotoneX, line } from 'd3-shape';
import { useSvgId } from '@/hooks/useSvgId';

interface Props {
  values: number[];
  width?: number;
  height?: number;
  color?: string;
  label?: string;
}

export const Sparkline = memo(function Sparkline({ values, width = 96, height = 28, color = 'var(--acc)', label }: Props) {
  const uid = useSvgId('sp');
  if (values.length < 2) return null;
  const x = scaleLinear().domain([0, values.length - 1]).range([2, width - 4]);
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  const y = scaleLinear().domain([lo, hi === lo ? lo + 1 : hi]).range([height - 3, 4]);
  const ln = line<number>().x((_, i) => x(i)).y((d) => y(d)).curve(curveMonotoneX)(values) ?? '';
  const ar = area<number>().x((_, i) => x(i)).y0(height).y1((d) => y(d)).curve(curveMonotoneX)(values) ?? '';
  const lastV = values[values.length - 1]!;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : true} style={{ display: 'block', overflow: 'visible' }}>
      <defs>
        <linearGradient id={uid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" style={{ stopColor: color, stopOpacity: 0.28 }} />
          <stop offset="100%" style={{ stopColor: color, stopOpacity: 0 }} />
        </linearGradient>
      </defs>
      <path d={ar} fill={`url(#${uid})`} />
      <path d={ln} fill="none" style={{ stroke: color }} strokeWidth={1.7} strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={x(values.length - 1)} cy={y(lastV)} r={2.6} style={{ fill: color }} />
    </svg>
  );
});
