import { useMemo } from 'react';
import { useDashboard } from '@/app/dashboard-context';
import { TimeSeriesChart } from '@/components/charts/TimeSeriesChart';
import { TipTitle, TipValue } from '@/components/charts/ChartTooltip';
import { cycleTicks } from '@/components/charts/axis';
import { Stat } from '@/components/ui/controls';
import { Modal } from '@/components/ui/Modal';
import { cycleThreatSeries, platformLabel } from '@/lib/analytics';
import { signed } from '@/lib/format';
import { gaugeZoneOf, toneVar, zoneOf } from '@/lib/threat';
import type { PlatformFilter } from '@/types/domain';
import page from '@/components/ui/page.module.css';
import s from './pulse.module.css';

interface Props {
  open: boolean;
  onClose: () => void;
  platform: PlatformFilter;
}

export function ThreatTrajectoryModal({ open, onClose, platform }: Props) {
  const d = useDashboard();
  const data = useMemo(() => {
    const values = cycleThreatSeries(d, platform);
    const series = values.map((value, i) => ({ value, label: d.cycles[i]?.label ?? '' }));
    const cur = values[values.length - 1] ?? 0;
    const prev = values[values.length - 2] ?? cur;
    return {
      series,
      cur,
      delta: cur - prev,
      hi: Math.max(...values),
      lo: Math.min(...values),
      net: cur - (values[0] ?? cur),
      ticks: cycleTicks(d.cycles.map((c) => c.label)),
    };
  }, [d, platform]);

  const deltaTone = (v: number) => (v > 0 ? 'neg' : v < 0 ? 'pos' : 'neu');

  return (
    <Modal open={open} onClose={onClose} eyebrow="Threat trajectory · 6-hour cycles" title={`${platformLabel(platform)} — threat over 7 days`}>
      <div className={page.grid4} style={{ marginBottom: 18 }}>
        <Stat label="Current" value={data.cur} tone={zoneOf(data.cur).tone} />
        <Stat label="Since last run" value={`${signed(data.delta)} pts`} tone={deltaTone(data.delta)} />
        <Stat label="7-day high" value={data.hi} />
        <Stat label="7-day low" value={data.lo} />
      </div>
      <TimeSeriesChart
        data={data.series}
        height={240}
        ariaLabel="Threat score per 6-hour cycle over 7 days"
        xTicks={data.ticks}
        renderTooltip={(p) => (
          <>
            <TipTitle>{p.label}</TipTitle>
            <TipValue>
              <b className="num" style={{ color: toneVar(gaugeZoneOf(p.value).tone) }}>
                {p.value}
              </b>
              threat score
            </TipValue>
          </>
        )}
      />
      <p className={s.modalNote}>
        Net change over 7 days:{' '}
        <b style={{ color: toneVar(deltaTone(data.net)) }}>{signed(data.net)} pts</b> · the score refreshes every {d.cadenceHours} hours.
      </p>
    </Modal>
  );
}
