import { useMemo, useState, type PointerEvent } from 'react';
import { geoMercator, geoPath } from 'd3-geo';
import { useElementSize } from '@/hooks/useElementSize';
import { STATE_TO_REGION, regionForState, useNegScale } from './geo';
import type { IndiaGeo } from '@/services/dashboard.service';
import type { GeoRegion } from '@/types/domain';
import { ChartTooltip, TipNote, TipTitle, TipValue } from './ChartTooltip';
import s from './charts.module.css';

interface Props {
  geo: IndiaGeo;
  regions: GeoRegion[];
  highlight?: string | null;
  onHighlight?: (region: string | null) => void;
}

/** Choropleth of negative sentiment by region. */
export function IndiaMap({ geo, regions, highlight, onHighlight }: Props) {
  const [ref, { width }] = useElementSize<HTMLDivElement>(520);
  const [tip, setTip] = useState<{ x: number; y: number; state: string } | null>(null);
  const { scale } = useNegScale(regions);
  const W = Math.max(260, width);
  const H = Math.round(Math.min(600, W * 1.12));

  const byName = useMemo(() => new Map(regions.map((r) => [r.name, r])), [regions]);
  const paths = useMemo(() => {
    // Mercator, as on official Survey of India style maps (rings are pre-wound for d3's spherical maths).
    const projection = geoMercator().fitExtent(
      [
        [4, 4],
        [W - 4, H - 4],
      ],
      geo,
    );
    const path = geoPath(projection);
    return geo.features.map((f) => ({ state: f.properties.st, region: regionForState(f.properties.st), d: path(f) ?? '' }));
  }, [geo, W, H]);

  const onMove = (e: PointerEvent<SVGPathElement>, state: string) => {
    const box = (e.currentTarget.ownerSVGElement as SVGSVGElement).getBoundingClientRect();
    setTip({ x: e.clientX - box.left, y: e.clientY - box.top, state });
    onHighlight?.(regionForState(state));
  };

  const tipRegion = tip ? byName.get(regionForState(tip.state)) : undefined;

  return (
    <div ref={ref} className={s.wrap}>
      <svg
        className={s.svg}
        width={W}
        height={H}
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label="Map of India shaded by negative sentiment per region"
        onPointerLeave={() => {
          setTip(null);
          onHighlight?.(null);
        }}
      >
        {paths.map((p) => {
          const r = byName.get(p.region);
          const isHi = highlight != null && highlight === p.region;
          const dim = highlight != null && !isHi;
          return (
            <path
              key={p.state}
              d={p.d}
              fill={r ? scale(r.neg) : 'var(--hair-2)'}
              style={{
                stroke: isHi ? 'var(--ink-2)' : 'var(--panel)',
                cursor: 'pointer',
                transition: 'opacity 160ms, stroke 160ms',
              }}
              strokeWidth={isHi ? 1.1 : 0.6}
              strokeLinejoin="round"
              opacity={dim ? 0.45 : 0.9}
              onPointerMove={(e) => onMove(e, p.state)}
            />
          );
        })}
      </svg>
      {tip && tipRegion && (
        <ChartTooltip x={tip.x} y={tip.y} bound={W} below={tip.y < 120}>
          <TipTitle>
            {tipRegion.name}
            {STATE_TO_REGION[tip.state] ? '' : ` · ${tip.state}`}
          </TipTitle>
          <TipValue>
            <b className="num" style={{ color: scale(tipRegion.neg) }}>
              {tipRegion.neg}%
            </b>
            negative · {tipRegion.share}% of volume
          </TipValue>
          <TipNote>{tipRegion.note}</TipNote>
        </ChartTooltip>
      )}
    </div>
  );
}
