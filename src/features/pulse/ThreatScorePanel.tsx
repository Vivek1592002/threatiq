import { useMemo, useState } from 'react';
import { useDashboard } from '@/app/dashboard-context';
import { RadarGauge } from '@/components/charts/RadarGauge';
import { TimeSeriesChart } from '@/components/charts/TimeSeriesChart';
import { TipNote, TipTitle, TipValue } from '@/components/charts/ChartTooltip';
import { dailyTicks } from '@/components/charts/axis';
import { Delta, Segmented, Select } from '@/components/ui/controls';
import { Eyebrow, Panel } from '@/components/ui/Panel';
import { HistoryStats } from '@/features/shared/HistoryStats';
import { historyStats, platformLabel, pulseThreat } from '@/lib/analytics';
import { dayLabel } from '@/lib/format';
import { PLATFORM_OPTIONS } from '@/lib/options';
import { gaugeZoneOf, toneVar, zoneOf } from '@/lib/threat';
import type { PlatformFilter } from '@/types/domain';
import { ThreatTrajectoryModal } from './ThreatTrajectoryModal';
import s from './pulse.module.css';

const RANGES = [
  { value: 3, label: '3D' },
  { value: 7, label: '1W' },
  { value: 30, label: '1M' },
  { value: 90, label: '3M' },
  { value: 180, label: '6M' },
  { value: 365, label: '1Y' },
] as const;

type Range = (typeof RANGES)[number]['value'];

export function ThreatScorePanel() {
  const d = useDashboard();
  const [platform, setPlatform] = useState<PlatformFilter>('all');
  const [range, setRange] = useState<Range>(365);
  const [modal, setModal] = useState(false);

  const pt = useMemo(() => pulseThreat(d, platform), [d, platform]);
  const stats = useMemo(() => historyStats(pt.series), [pt.series]);
  const zone = zoneOf(pt.threat);

  const { series, markers, eventAt } = useMemo(() => {
    const series = pt.series.slice(-range);
    const first = series[0]?.index ?? 0;
    const events = pt.events.filter((e) => e.index >= first);
    return {
      series,
      markers: events.map((e) => ({ at: e.index - first, title: e.title })),
      eventAt: new Map(events.map((e) => [e.index - first, e])),
    };
  }, [pt, range]);

  return (
    <Panel
      className={s.hero}
      title="Threat score"
      subtitle={`${platformLabel(platform)} · ${d.current.window}`}
      actions={<Select label="Platform" value={platform} options={PLATFORM_OPTIONS} onChange={setPlatform} />}
    >
      <div className={s.heroGrid}>
        <button type="button" className={s.gaugeBtn} onClick={() => setModal(true)} aria-label="Open threat trajectory">
          <span className={s.scope} aria-hidden="true" />
          <RadarGauge value={pt.threat} size={286} />
          <span className={s.gaugeHint}>View 7-day trajectory →</span>
        </button>

        <div className={s.readout}>
          <Eyebrow>Current status</Eyebrow>
          <div className={s.statusRow}>
            <span className={s.statusWord} style={{ color: toneVar(zone.tone) }}>
              {zone.word}
            </span>
            <Delta value={pt.delta} suffix=" pts" />
            <span className={s.vs}>vs previous cycle</span>
          </div>
          <p className={s.advice}>{zone.advice}</p>
          <HistoryStats stats={stats} />
        </div>
      </div>

      <div className={s.trendHead}>
        <div>
          <Eyebrow>Threat trend</Eyebrow>
          <p className={s.trendSub}>Daily reading · ◆ key moments — hover or use ← → keys</p>
        </div>
        <Segmented label="Time range" value={range} options={RANGES} onChange={setRange} />
      </div>
      <TimeSeriesChart
        data={series}
        height={230}
        ariaLabel={`Threat score over the last ${range} days`}
        xTicks={dailyTicks(series)}
        markers={markers}
        renderTooltip={(p, i) => {
          const e = eventAt.get(i);
          return (
            <>
              <TipTitle>
                {e ? `${e.title} · ` : ''}
                {dayLabel(p.date)}
              </TipTitle>
              <TipValue>
                <b className="num" style={{ color: toneVar(gaugeZoneOf(p.value).tone) }}>
                  {p.value}
                </b>
                threat score
              </TipValue>
              {e && <TipNote>{e.note}</TipNote>}
            </>
          );
        }}
      />

      <ThreatTrajectoryModal open={modal} onClose={() => setModal(false)} platform={platform} />
    </Panel>
  );
}
