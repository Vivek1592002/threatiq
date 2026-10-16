import { useDashboard } from '@/app/dashboard-context';
import { Sparkline } from '@/components/charts/Sparkline';
import { Delta } from '@/components/ui/controls';
import { Icon } from '@/components/ui/Icon';
import { compact, signedCompact } from '@/lib/format';
import { isUrgent } from '@/lib/analytics';
import { severityTone, toneVar } from '@/lib/threat';
import s from './pulse.module.css';

/** "Last 6 hours" — movement since the previous refresh. */
export function CycleTiles() {
  const d = useDashboard();
  const c = d.current;
  const cyc = d.cycles;
  const last = cyc[cyc.length - 1];
  const prev = cyc[cyc.length - 2];
  const urgent = d.alerts.filter((a) => isUrgent(a.severity));
  const dAlert = (last?.alerts ?? 0) - (prev?.alerts ?? 0);
  const prevVol = c.volume - c.dVolume;
  const posReach = Math.round((c.reach * c.pos) / 100);
  const negReach = Math.round((c.reach * c.neg) / 100);

  return (
    <section aria-labelledby="cycle-title">
      <div className={s.sectionHead}>
        <h2 id="cycle-title" className={s.sectionTitle}>
          Last 6 hours
        </h2>
        <span className={s.sectionSub}>movement since the previous refresh</span>
      </div>
      <div className={s.tiles}>
        <article className={s.tile}>
          <div className={s.tileHead}>
            <span className={s.tileLabel}>
              <Icon name="alert" size={14} /> Priority alerts
            </span>
            <div className={s.sevDots} aria-hidden="true">
              {urgent.map((a) => (
                <span key={a.id} style={{ background: toneVar(severityTone[a.severity]) }} />
              ))}
            </div>
          </div>
          <div className={`${s.tileBig} num`}>{urgent.length}</div>
          <div className={s.tileRow}>
            <Delta value={dAlert} plain />
            <span>critical &amp; high</span>
          </div>
          <div className={s.tilePrev}>
            last cycle <b className="num">{prev?.alerts ?? 0}</b>
          </div>
        </article>

        <article className={s.tile}>
          <div className={s.tileHead}>
            <span className={s.tileLabel}>
              <Icon name="pulse" size={14} /> Cycle volume
            </span>
            <Sparkline values={cyc.map((y) => y.volume)} width={110} height={30} label="Volume over the last 28 cycles" />
          </div>
          <div className={`${s.tileBig} num`}>{compact(c.volume)}</div>
          <div className={s.tileRow}>
            <Delta value={c.dVolume} plain format={signedCompact} />
            <span>vs last 6h</span>
          </div>
          <div className={s.tilePrev}>
            last cycle <b className="num">{compact(prevVol)}</b>
          </div>
        </article>

        <article className={s.tile}>
          <div className={s.tileHead}>
            <span className={s.tileLabel}>
              <Icon name="radar" size={14} /> Reach
            </span>
          </div>
          <div className={`${s.tileBig} num`}>{compact(c.reach)}</div>
          <div className={s.split} role="img" aria-label={`${c.pos}% positive, ${c.neg}% negative reach`}>
            <i style={{ flex: c.pos, background: 'var(--pos)' }} />
            <i style={{ flex: c.neu, background: 'var(--neu)', opacity: 0.45 }} />
            <i style={{ flex: c.neg, background: 'var(--neg)' }} />
          </div>
          <div className={s.splitLegend}>
            <span>
              <i style={{ background: 'var(--pos)' }} />
              <b className="num" style={{ color: 'var(--pos)' }}>
                {compact(posReach)}
              </b>{' '}
              positive
            </span>
            <span>
              <i style={{ background: 'var(--neg)' }} />
              <b className="num" style={{ color: 'var(--neg)' }}>
                {compact(negReach)}
              </b>{' '}
              negative
            </span>
          </div>
        </article>
      </div>
    </section>
  );
}
