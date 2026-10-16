import { useSearchParams } from 'react-router-dom';
import { RdrMark } from '@/components/brand/RdrMark';
import { Button, Pill, Segmented } from '@/components/ui/controls';
import { compact, signed } from '@/lib/format';
import { authTone, statusTone, toneVar } from '@/lib/threat';
import type { Narrative } from '@/types/domain';
import { HeroScore } from './HeroScore';
import { OverviewTab } from './OverviewTab';
import { SpreadTab } from './SpreadTab';
import s from './detail.module.css';

type Tab = 'overview' | 'spread';

const TABS = [
  { value: 'overview', label: 'Overview' },
  { value: 'spread', label: 'Spread & sources' },
] as const;

export function NarrativeDetail({ narrative: n, onClose }: { narrative: Narrative; onClose: () => void }) {
  // Section lives in the URL so a deep-dive section can be linked directly.
  const [params, setParams] = useSearchParams();
  const tab: Tab = params.get('tab') === 'spread' ? 'spread' : 'overview';
  const setTab = (t: Tab) =>
    setParams(
      (p) => {
        if (t === 'overview') p.delete('tab');
        else p.set('tab', t);
        return p;
      },
      { replace: true },
    );

  return (
    <>
      <div className={s.topbar}>
        <div className={s.topbarInner}>
          <Button variant="secondary" size="sm" icon="arrowLeft" onClick={onClose}>
            Back
          </Button>
          <RdrMark size={24} animated={false} title="" />
          <span className={s.topbarTitle}>{n.name}</span>
          <span className={s.topbarHint}>Esc to close</span>
        </div>
      </div>
    <div className={s.page}>
      <header className={s.head}>
        <div className={s.headMeta}>
          <span className={s.kicker}>{n.type}</span>
          <Pill tone={statusTone[n.status]} dot>
            {n.status}
          </Pill>
        </div>
        <h1 className={s.title}>{n.name}</h1>
        <Summary n={n} />
      </header>

      <HeroScore narrative={n} />

      <div className={s.tabs}>
        <Segmented label="Detail section" size="lg" value={tab} options={TABS} onChange={setTab} />
      </div>

      {tab === 'overview' ? <OverviewTab narrative={n} /> : <SpreadTab narrative={n} />}
    </div>
    </>
  );
}

function Summary({ n }: { n: Narrative }) {
  const dir = n.projection > 0 ? 'rising' : n.projection < 0 ? 'cooling' : 'holding steady';
  const type = n.type.toLowerCase();
  const article = /^[aeiou]/.test(type) ? 'An' : 'A';
  const org =
    n.authenticity == null ? null : n.authenticity >= 70 ? 'largely organic' : n.authenticity >= 40 ? 'partly coordinated' : 'likely coordinated / inauthentic';

  return (
    <p className={s.summary}>
      {article} {type} narrative, currently <b>{n.status.toLowerCase()}</b>
      {n.status.toLowerCase() === dir ? '' : ` and ${dir}`}. It carries <b>{compact(n.volume)}</b> mentions reaching{' '}
      <b>{compact(n.reach)}</b>, {n.neg}% negative, and is projected to move the score{' '}
      <b style={{ color: n.projection > 0 ? 'var(--neg)' : 'var(--pos)' }}>{signed(n.projection)} pts</b> in 24h. First surfaced from{' '}
      <b>{n.origin}</b>
      {org && n.authenticity != null && (
        <>
          ; spread looks <b style={{ color: toneVar(authTone(n.authenticity)) }}>{org}</b> ({n.authenticity}/100)
        </>
      )}
      .
    </p>
  );
}
