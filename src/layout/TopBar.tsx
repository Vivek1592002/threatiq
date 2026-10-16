import { useDashboard } from '@/app/dashboard-context';
import { RdrLogo } from '@/components/brand/RdrLogo';
import { IconButton } from '@/components/ui/controls';
import { useCountdown } from '@/hooks/useCountdown';
import { useThemeStore } from '@/store/theme.store';
import s from './layout.module.css';

export function TopBar() {
  const d = useDashboard();
  const countdown = useCountdown(d.nextRefresh, d.cadenceHours);
  const theme = useThemeStore((st) => st.theme);
  const toggle = useThemeStore((st) => st.toggle);

  return (
    <header className={s.bar}>
      <div className={s.barInner}>
        <RdrLogo />
        <span className={s.divider} aria-hidden="true" />
        <div className={s.context}>
          <span className={s.contextEyebrow}>Monitoring</span>
          <span className={s.contextTitle} title={d.topic}>
            {d.topic}
          </span>
        </div>
        <span className={s.client}>{d.client}</span>
        <span className={s.spacer} />
        <div className={s.live} title={`Last cycle ${d.generatedAt}`}>
          <span className={s.liveDot} aria-hidden="true" />
          <span className={s.liveText}>
            Live <span className={s.liveSep}>·</span> {d.cadenceHours}h refresh <span className={s.liveSep}>·</span> next in{' '}
            <b className="num">{countdown}</b>
          </span>
        </div>
        <IconButton
          icon={theme === 'dark' ? 'sun' : 'moon'}
          label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
          onClick={toggle}
        />
      </div>
    </header>
  );
}
