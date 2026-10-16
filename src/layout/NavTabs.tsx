import { NavLink } from 'react-router-dom';
import { motion } from 'motion/react';
import { useDashboard } from '@/app/dashboard-context';
import { Icon, type IconName } from '@/components/ui/Icon';
import { isUrgent } from '@/lib/analytics';
import { useTrackingStore } from '@/store/tracking.store';
import s from './layout.module.css';

export function NavTabs() {
  const d = useDashboard();
  const removed = useTrackingStore((st) => st.removed);
  const pending = useTrackingStore((st) => st.pending.length);
  const urgent = d.alerts.filter((a) => isUrgent(a.severity)).length;
  const narratives = d.narratives.filter((n) => !removed.includes(n.name)).length + pending;

  const tabs: { to: string; label: string; icon: IconName; badge?: number; hot?: boolean }[] = [
    { to: '/pulse', label: 'Pulse', icon: 'pulse', badge: urgent, hot: urgent > 0 },
    { to: '/narratives', label: 'Narratives', icon: 'layers', badge: narratives },
    { to: '/audience', label: 'Audience', icon: 'users' },
  ];

  return (
    <nav className={s.tabsBar} aria-label="Primary">
      <div className={s.tabs}>
        {tabs.map((t) => (
          <NavLink key={t.to} to={t.to} className={({ isActive }) => [s.tab, isActive && s.tabOn].filter(Boolean).join(' ')}>
            {({ isActive }) => (
              <>
                {isActive && <motion.span layoutId="nav-pill" className={s.tabPill} transition={{ type: 'spring', stiffness: 420, damping: 36 }} />}
                <Icon name={t.icon} size={15} />
                <span>{t.label}</span>
                {t.badge != null && t.badge > 0 && (
                  <span className={[s.badge, t.hot && s.badgeHot].filter(Boolean).join(' ')} aria-label={`${t.badge} items`}>
                    {t.badge}
                  </span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
