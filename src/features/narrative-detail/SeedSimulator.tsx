import { useMemo, useState, type CSSProperties } from 'react';
import { useDashboard } from '@/app/dashboard-context';
import { RadarGauge } from '@/components/charts/RadarGauge';
import { Select } from '@/components/ui/controls';
import { Panel } from '@/components/ui/Panel';
import { narrativePlatforms, positivesNeeded, seedBaseline } from '@/lib/analytics';
import { compact } from '@/lib/format';
import { platformOptions } from '@/lib/options';
import type { Narrative, PlatformFilter } from '@/types/domain';
import s from './detail.module.css';

const defaultTarget = (now: number) => Math.max(Math.min(20, now - 1), now - 9);

/**
 * What-if: how many genuine positive comments would dilute the negative
 * share enough to bring this narrative's threat down to a target.
 */
export function SeedSimulator({ narrative: n }: { narrative: Narrative }) {
  const d = useDashboard();
  const [platform, setPlatform] = useState<PlatformFilter>('all');
  const base = useMemo(() => seedBaseline(d, n, platform), [d, n, platform]);
  const [target, setTarget] = useState(() => defaultTarget(base.now));
  const min = Math.min(20, base.now - 1);
  const need = positivesNeeded(base, target);
  const fill = ((target - min) / Math.max(1, base.now - min)) * 100;

  const changePlatform = (p: PlatformFilter) => {
    setPlatform(p);
    setTarget(defaultTarget(seedBaseline(d, n, p).now));
  };

  return (
    <Panel
      title="Positive comments to seed"
      subtitle="Drag the target to model an intervention"
      actions={<Select label="Platform" value={platform} options={platformOptions(narrativePlatforms(n))} onChange={changePlatform} />}
    >
      <div className={s.seed}>
        <div className={s.seedGauge}>
          <RadarGauge value={target} size={190} compact label="Target threat score" />
          <input
            type="range"
            className={s.slider}
            min={min}
            max={base.now}
            step={1}
            value={target}
            onChange={(e) => setTarget(Number(e.target.value))}
            aria-label="Target threat score"
            aria-valuetext={`Target ${target}`}
            style={{ '--fill': `${fill}%` } as CSSProperties}
          />
          <div className={s.sliderScale}>
            <span>Ambitious · {min}</span>
            <span>Current · {base.now}</span>
          </div>
        </div>
        <div className={s.seedResult}>
          <div className={s.subhead}>Positive comments needed</div>
          <div className={`${s.seedBig} num`}>{need > 0 ? `+${compact(need)}` : '0'}</div>
          <p className={s.seedLine}>
            {target >= base.now ? (
              <>
                Holding <b>{base.label}</b> at <b>{base.now}</b> needs no net new positive comments — defend the advocates already in play.
              </>
            ) : (
              <>
                On <b>{base.label}</b>, bringing the threat score from <b>{base.now}</b> down to <b>{target}</b> dilutes{' '}
                <b>{compact(base.negCount)}</b> negative mentions — about <b style={{ color: 'var(--pos)' }}>{compact(need)}</b> positive comments{' '}
                {platform === 'all' ? 'across platforms' : `on ${base.label}`}.
              </>
            )}
          </p>
        </div>
      </div>
    </Panel>
  );
}
