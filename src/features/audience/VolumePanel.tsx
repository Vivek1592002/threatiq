import { useMemo, useState } from 'react';
import { useDashboard } from '@/app/dashboard-context';
import { TimeSeriesChart } from '@/components/charts/TimeSeriesChart';
import { TipNote, TipTitle, TipValue } from '@/components/charts/ChartTooltip';
import { dailyTicks } from '@/components/charts/axis';
import { Segmented, Select } from '@/components/ui/controls';
import { Panel } from '@/components/ui/Panel';
import { HistoryStats } from '@/features/shared/HistoryStats';
import { historyStats, platformLabel, volumeHistory } from '@/lib/analytics';
import { compact, dayLabel } from '@/lib/format';
import { PLATFORM_COLOR, PLATFORM_OPTIONS } from '@/lib/options';
import type { PlatformFilter } from '@/types/domain';
import s from './audience.module.css';

const RANGES = [
  { value: 60, label: '2M' },
  { value: 180, label: '6M' },
  { value: 270, label: '9M' },
  { value: 365, label: '1Y' },
] as const;
type Range = (typeof RANGES)[number]['value'];

export function VolumePanel() {
  const d = useDashboard();
  const [platform, setPlatform] = useState<PlatformFilter>('all');
  const [range, setRange] = useState<Range>(365);
  const color = platform === 'all' ? 'var(--acc)' : PLATFORM_COLOR[platform];

  const stats = useMemo(() => historyStats(volumeHistory(d, platform, 365)), [d, platform]);
  const { series, markers, eventAt } = useMemo(() => {
    const series = volumeHistory(d, platform, range);
    const pos = new Map(series.map((p, i) => [p.index, i]));
    const events = d.history.events.filter((e) => pos.has(e.index));
    return {
      series,
      markers: events.map((e) => ({ at: pos.get(e.index)!, title: e.title })),
      eventAt: new Map(events.map((e) => [pos.get(e.index)!, e])),
    };
  }, [d, platform, range]);

  return (
    <Panel
      title="Conversation volume"
      subtitle={`Daily mentions · ${platformLabel(platform)}`}
      actions={
        <>
          <Segmented label="Time range" value={range} options={RANGES} onChange={setRange} />
          <Select label="Platform" value={platform} options={PLATFORM_OPTIONS} onChange={setPlatform} />
        </>
      }
    >
      <div className={s.volStats}>
        <HistoryStats stats={stats} format={compact} tones={{ hi: color, med: 'var(--ink)', lo: 'var(--ink-2)' }} medianHint="typical day" variant="neutral" layout="row" />
      </div>
      <TimeSeriesChart
        variant="volume"
        color={color}
        data={series}
        height={240}
        ariaLabel={`Daily conversation volume, last ${range} days`}
        xTicks={dailyTicks(series)}
        yFormat={compact}
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
                <b className="num" style={{ color }}>
                  {compact(p.value)}
                </b>
                mentions · {platformLabel(platform).toLowerCase()}
              </TipValue>
              {e && <TipNote>{e.note}</TipNote>}
            </>
          );
        }}
      />
    </Panel>
  );
}
