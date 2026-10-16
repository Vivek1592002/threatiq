import type { CSSProperties } from 'react';
import { useDashboard } from '@/app/dashboard-context';
import { SentimentBar } from '@/components/charts/SentimentBar';
import { PlatformIcon } from '@/components/ui/PlatformIcon';
import { PLATFORM_LABEL } from '@/lib/analytics';
import { compact } from '@/lib/format';
import { PLATFORM_COLOR } from '@/lib/options';
import { PLATFORMS } from '@/types/domain';
import s from './audience.module.css';

export function ChannelCards() {
  const d = useDashboard();
  const total = PLATFORMS.reduce((sum, k) => sum + d.channels[k].mentions, 0) || 1;

  return (
    <div className={s.channels}>
      {PLATFORMS.map((k) => {
        const c = d.channels[k];
        return (
          <article key={k} className={s.channel} style={{ '--c': PLATFORM_COLOR[k] } as CSSProperties}>
            <div className={s.channelHead}>
              <span className={s.channelName}>
                <PlatformIcon platform={k} size={18} />
                {PLATFORM_LABEL[k]}
                {c.toneOnly && <span className={s.toneTag}>tone</span>}
              </span>
              <span className={`${s.share} num`}>{((100 * c.mentions) / total).toFixed(1)}%</span>
            </div>
            <div className={`${s.channelBig} num`}>{compact(c.mentions)}</div>
            <div className={s.channelMeta}>mentions · {c.engagement ? `${compact(c.engagement)} engagement` : 'coverage'}</div>
            <SentimentBar pos={c.pos} neu={c.neu} neg={c.neg} />
            <div className={s.sentLegend}>
              <span style={{ color: 'var(--pos)' }}>{c.pos}% pos</span>
              <span>{c.neu}% neu</span>
              <span style={{ color: 'var(--neg)' }}>{c.neg}% neg</span>
            </div>
          </article>
        );
      })}
    </div>
  );
}
