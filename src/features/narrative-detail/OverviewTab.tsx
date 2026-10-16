import { useMemo, useState } from 'react';
import { useDashboard } from '@/app/dashboard-context';
import { BarList } from '@/components/charts/BarList';
import { MultiLineChart, type LineSeries } from '@/components/charts/MultiLineChart';
import { cycleTicks } from '@/components/charts/axis';
import { Panel } from '@/components/ui/Panel';
import { PlatformIcon } from '@/components/ui/PlatformIcon';
import { PLATFORM_LABEL, narrativeVolumeByPlatform } from '@/lib/analytics';
import { compact } from '@/lib/format';
import { PLATFORM_COLOR } from '@/lib/options';
import { statusTone, toneVar } from '@/lib/threat';
import type { Narrative, PlatformKey } from '@/types/domain';
import { SeedSimulator } from './SeedSimulator';
import s from './detail.module.css';

export function OverviewTab({ narrative: n }: { narrative: Narrative }) {
  const d = useDashboard();

  const series: LineSeries[] = useMemo(
    () => [
      { key: 'overall', label: 'Overall', color: 'var(--acc)', values: n.series, emphasis: true },
      ...narrativeVolumeByPlatform(n).map((p) => ({
        key: p.platform,
        label: PLATFORM_LABEL[p.platform],
        color: PLATFORM_COLOR[p.platform],
        values: p.values,
        icon: <PlatformIcon platform={p.platform} size={14} />,
      })),
    ],
    [n],
  );
  const [visible, setVisible] = useState<Set<string>>(() => new Set(series.map((x) => x.key)));
  const toggle = (k: string) =>
    setVisible((prev) => {
      const next = new Set(prev);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      return next;
    });

  const labels = d.cycles.map((c) => c.label);
  const shares = (Object.entries(n.platformShare) as [PlatformKey, number][]).sort((a, b) => b[1] - a[1]);

  return (
    <div className={s.stack}>
      <Panel title="Volume by platform" subtitle="Mentions per 6-hour cycle · tap the legend to compare">
        <MultiLineChart
          series={series}
          visible={visible}
          onToggle={toggle}
          xTicks={cycleTicks(labels)}
          xLabel={(i) => labels[i] ?? ''}
          yFormat={compact}
          ariaLabel={`Mentions per cycle for ${n.name}, by platform`}
        />
      </Panel>

      <div className={s.split}>
        <SeedSimulator narrative={n} />
        <Panel title="Posts by platform" subtitle="Share of this narrative's volume">
          <BarList
            ariaLabel="Posts by platform"
            rows={shares.map(([k, v]) => ({
              key: k,
              label: PLATFORM_LABEL[k],
              icon: <PlatformIcon platform={k} size={16} />,
              value: v,
              color: PLATFORM_COLOR[k],
              valueLabel: (
                <>
                  <b style={{ color: 'var(--ink)' }}>{compact(Math.round((n.volume * v) / 100))}</b> · {v}%
                </>
              ),
            }))}
          />
        </Panel>
      </div>

      <Panel title="What people are saying" subtitle="Claims in circulation">
        <ul className={s.quotes}>
          {n.claims.map((c) => (
            <li key={c} className={s.quote} style={{ borderColor: toneVar(statusTone[n.status]) }}>
              “{c}”
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}
