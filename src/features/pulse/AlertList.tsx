import type { CSSProperties } from 'react';
import { useDashboard } from '@/app/dashboard-context';
import { Pill } from '@/components/ui/controls';
import { Icon } from '@/components/ui/Icon';
import { useNarrativeRoute } from '@/features/narrative-detail/useNarrativeRoute';
import { isUrgent, narrativeForAlert } from '@/lib/analytics';
import { compact } from '@/lib/format';
import { authTone, severityTone, toneVar } from '@/lib/threat';
import s from './pulse.module.css';

/** Critical & high alerts; each opens its narrative deep-dive. */
export function AlertList() {
  const d = useDashboard();
  const { open } = useNarrativeRoute();
  const urgent = d.alerts.filter((a) => isUrgent(a.severity));

  return (
    <section aria-labelledby="alerts-title">
      <div className={s.sectionHead}>
        <h2 id="alerts-title" className={s.sectionTitle}>
          Needs attention now
        </h2>
        <span className={s.sectionSub}>critical &amp; high only · open any to see the full narrative</span>
      </div>
      <ul className={s.alerts}>
        {urgent.map((a, i) => {
          const n = narrativeForAlert(d.narratives, a.narrative);
          const tone = toneVar(severityTone[a.severity]);
          return (
            <li key={a.id} className={s.rise} style={{ animationDelay: `${60 * i}ms` }}>
              <button
                type="button"
                className={s.alert}
                style={{ '--sv': tone } as CSSProperties}
                onClick={() => n && open(n.id)}
                disabled={!n}
              >
                <span className={s.alertSignal} aria-hidden="true">
                  <span />
                </span>
                <span className={s.alertMain}>
                  <span className={s.alertTop}>
                    <Pill tone={severityTone[a.severity]} dot>
                      {a.severity}
                    </Pill>
                    <span className={s.alertType}>{a.type}</span>
                  </span>
                  <span className={s.alertTitle}>{a.title}</span>
                  <span className={s.alertSub}>{a.why}</span>
                </span>
                <span className={s.alertMetrics}>
                  <Metric label="Velocity" value={`${a.velocity}/hr`} />
                  <Metric label="24h impact" value={a.projection.replace(' threat pts in 24h', ' pts')} color="var(--neg)" />
                  <Metric label="Reach" value={compact(a.reach)} />
                  <Metric label="Authenticity" value={`${a.authenticity}`} color={toneVar(authTone(a.authenticity))} />
                </span>
                <span className={s.alertGo} aria-hidden="true">
                  <Icon name="arrowRight" size={16} />
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function Metric({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <span className={s.metric}>
      <span className={s.metricLabel}>{label}</span>
      <span className={`${s.metricValue} num`} style={color ? { color } : undefined}>
        {value}
      </span>
    </span>
  );
}
