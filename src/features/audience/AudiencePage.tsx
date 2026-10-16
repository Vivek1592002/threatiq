import { useDashboard } from '@/app/dashboard-context';
import { BarList } from '@/components/charts/BarList';
import { PageHeader } from '@/components/ui/PageHeader';
import { Panel } from '@/components/ui/Panel';
import { langTone, toneVar } from '@/lib/threat';
import { ChannelCards } from './ChannelCards';
import { GeoPanel } from './GeoPanel';
import { VolumePanel } from './VolumePanel';
import page from '@/components/ui/page.module.css';
import s from './audience.module.css';

export default function AudiencePage() {
  const d = useDashboard();
  return (
    <>
      <PageHeader eyebrow="Audience" title="Audience & conversation" subtitle="Where the conversation lives, how volume is moving, and what it feels like" />
      <div className={page.stack}>
        <ChannelCards />
        <VolumePanel />
        <div className={page.grid2}>
          <Panel title="Emotion breakdown" subtitle="Beyond positive / negative — the flavour of the reaction">
            <BarList ariaLabel="Emotion share" rows={d.emotions.map((e) => ({ key: e.name, label: e.name, value: e.pct, color: toneVar(e.tone) }))} />
          </Panel>
          <Panel title="Language communities" subtitle="Volume share & negative lean">
            <BarList
              ariaLabel="Language share"
              rows={d.languages.map((l) => ({
                key: l.name,
                label: l.name,
                value: l.share,
                color: toneVar(langTone(l.neg)),
                valueLabel: (
                  <>
                    <b style={{ color: 'var(--ink)' }}>{l.share}%</b> · <span style={{ color: toneVar(langTone(l.neg)) }}>{l.neg}% neg</span>
                  </>
                ),
              }))}
            />
            <p className={s.note}>Bar width = share of conversation · colour = negative lean (red = hostile, green = supportive).</p>
          </Panel>
        </div>
        <GeoPanel />
      </div>
    </>
  );
}
