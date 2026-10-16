import { AlertList } from './AlertList';
import { CycleTiles } from './CycleTiles';
import { ThreatScorePanel } from './ThreatScorePanel';
import page from '@/components/ui/page.module.css';

export default function PulsePage() {
  return (
    <div className={page.stack} style={{ gap: 26 }}>
      <ThreatScorePanel />
      <CycleTiles />
      <AlertList />
    </div>
  );
}
