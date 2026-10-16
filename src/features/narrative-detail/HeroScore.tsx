import { useMemo, useState } from 'react';
import { useDashboard } from '@/app/dashboard-context';
import { RadarGauge } from '@/components/charts/RadarGauge';
import { Delta, Pill, Select, Stat } from '@/components/ui/controls';
import { Panel } from '@/components/ui/Panel';
import { PlatformIcon } from '@/components/ui/PlatformIcon';
import { PLATFORM_LABEL, narrativePlatforms, narrativeStats, platformBreakdown, platformLabel } from '@/lib/analytics';
import { compact, signed } from '@/lib/format';
import { platformOptions } from '@/lib/options';
import { authTone, zoneOf } from '@/lib/threat';
import type { Narrative, PlatformFilter } from '@/types/domain';
import s from './detail.module.css';

export function HeroScore({ narrative: n }: { narrative: Narrative }) {
  const d = useDashboard();
  const [platform, setPlatform] = useState<PlatformFilter>('all');
  const st = useMemo(() => narrativeStats(d, n, platform), [d, n, platform]);
  const breakdown = useMemo(() => platformBreakdown(d, n), [d, n]);

  return (
    <Panel
      className={s.hero}
      title="Threat score"
      subtitle={`This narrative · ${platformLabel(platform)}`}
      actions={<Select label="Platform" value={platform} options={platformOptions(narrativePlatforms(n))} onChange={setPlatform} />}
    >
      <div className={s.heroGrid}>
        <div className={s.heroGauge}>
          <RadarGauge value={st.threat} size={250} label="Narrative threat score" />
          <div className={s.heroStatus}>
            <Delta value={st.projection} suffix=" pts" />
            <span className={s.heroStatusLabel}>projected next 24h</span>
          </div>
        </div>
        <div className={s.statGrid}>
          <Stat label="Volume" value={compact(st.volume)} hint="mentions" />
          <Stat
            label="Velocity"
            value={
              <>
                {st.velocity}/hr <span style={{ color: n.acceleration > 0 ? 'var(--neg)' : 'var(--pos)', fontSize: 15 }}>{n.acceleration > 0 ? '▲' : '▼'}</span>
              </>
            }
            hint={n.acceleration > 0 ? 'accelerating' : 'slowing'}
          />
          <Stat label="24h projection" value={`${signed(st.projection)} pts`} tone={st.projection > 0 ? 'neg' : 'pos'} hint="threat impact" />
          <Stat label="Total reach" value={compact(st.reach)} hint="accounts reached" />
          <Stat
            label="Authenticity"
            value={st.authenticity != null ? `${st.authenticity}/100` : '—'}
            tone={st.authenticity != null ? authTone(st.authenticity) : undefined}
            hint={st.authenticity != null ? (st.authenticity >= 70 ? 'organic' : st.authenticity >= 40 ? 'mixed signals' : 'coordinated') : undefined}
          />
        </div>
      </div>

      {platform === 'all' && (
        <div className={s.breakdown}>
          <div className={s.subhead}>Breakdown by platform</div>
          <div className={s.tableScroll}>
            <table className={s.table}>
              <thead>
                <tr>
                  <th>Platform</th>
                  <th>Volume</th>
                  <th>Velocity</th>
                  <th>24h proj.</th>
                  <th>Reach</th>
                  <th>Threat</th>
                </tr>
              </thead>
              <tbody>
                {breakdown.map((r) => (
                  <tr key={r.platform}>
                    <td>
                      <span className={s.platCell}>
                        <PlatformIcon platform={r.platform} size={16} />
                        {PLATFORM_LABEL[r.platform]}
                      </span>
                    </td>
                    <td className="num">{compact(r.volume)}</td>
                    <td className="num">{r.velocity}/hr</td>
                    <td className="num" style={{ color: r.projection > 0 ? 'var(--neg)' : 'var(--pos)', fontWeight: 650 }}>
                      {signed(r.projection)}
                    </td>
                    <td className="num">{compact(r.reach)}</td>
                    <td>
                      <Pill tone={zoneOf(r.threat).tone}>{r.threat}</Pill>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Panel>
  );
}
