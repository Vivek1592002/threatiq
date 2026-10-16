import { useDashboard } from '@/app/dashboard-context';
import { RdrMark } from '@/components/brand/RdrMark';
import s from './layout.module.css';

export function Footer() {
  const d = useDashboard();
  return (
    <footer className={s.footer}>
      <RdrMark size={18} animated={false} title="" />
      <span>Rdr</span>
      <span className={s.footSep}>·</span>
      <span>{d.topic}</span>
      <span className={s.footSep}>·</span>
      <span>{d.client}</span>
      <span className={s.footSep}>·</span>
      <span>{d.cadenceHours}-hour refresh</span>
      <span className={s.footSep}>·</span>
      <span>last cycle {d.generatedAt}</span>
    </footer>
  );
}
