import { useState } from 'react';
import { useDashboard } from '@/app/dashboard-context';
import { IndiaMap } from '@/components/charts/IndiaMap';
import { useNegScale } from '@/components/charts/geo';
import { Panel } from '@/components/ui/Panel';
import { useIndiaGeoQuery } from '@/services/queries';
import s from './audience.module.css';

export function GeoPanel() {
  const d = useDashboard();
  const geo = useIndiaGeoQuery();
  const [highlight, setHighlight] = useState<string | null>(null);
  const { scale, lo, hi, colors } = useNegScale(d.geo);
  const domestic = d.geo.filter((r) => r.name !== 'Overseas').sort((a, b) => b.share - a.share);
  const overseas = d.geo.find((r) => r.name === 'Overseas');

  return (
    <Panel title="Geography" subtitle="Negative sentiment by region · hover the map or the list">
      <div className={s.geo}>
        <div className={s.map}>
          {geo.data ? (
            <IndiaMap geo={geo.data} regions={d.geo} highlight={highlight} onHighlight={setHighlight} />
          ) : (
            <div className={s.mapLoading} role="status">
              {geo.isError ? 'Map unavailable.' : 'Loading map…'}
            </div>
          )}
        </div>
        <div className={s.geoSide}>
          <div>
            <div className={s.legendTitle}>Negative sentiment</div>
            <div className={s.legendBar} style={{ background: `linear-gradient(90deg, ${colors.pos}, ${colors.warn}, ${colors.neg})` }} />
            <div className={s.legendScale}>
              <span>{lo}% low</span>
              <span>{hi}% high</span>
            </div>
          </div>
          <ul className={s.regions} onPointerLeave={() => setHighlight(null)}>
            {domestic.map((r) => (
              <li key={r.name}>
                <button
                  type="button"
                  className={s.region}
                  aria-pressed={highlight === r.name}
                  onPointerEnter={() => setHighlight(r.name)}
                  onFocus={() => setHighlight(r.name)}
                  onBlur={() => setHighlight(null)}
                >
                  <span className={s.regionSwatch} style={{ background: scale(r.neg) }} />
                  <span className={s.regionName}>
                    {r.name}
                    <span className={s.regionNote}>{r.note}</span>
                  </span>
                  <span className={s.regionVals}>
                    <b className="num" style={{ color: scale(r.neg) }}>
                      {r.neg}%
                    </b>
                    <span className="num">{r.share}% vol</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
          {overseas && (
            <p className={s.overseas}>
              <b>Overseas</b> · <b style={{ color: scale(overseas.neg) }}>{overseas.neg}%</b> negative · {overseas.share}% of volume — {overseas.note}{' '}
              <span className={s.dim}>(not shown on map)</span>
            </p>
          )}
        </div>
      </div>
    </Panel>
  );
}
