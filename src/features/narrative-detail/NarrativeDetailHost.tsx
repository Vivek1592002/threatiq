import { useDashboard } from '@/app/dashboard-context';
import { Sheet } from '@/components/ui/Sheet';
import { NarrativeDetail } from './NarrativeDetail';
import { useNarrativeRoute } from './useNarrativeRoute';

/** Mounted once in the shell; shows the deep-dive for `?narrative=<id>`. */
export default function NarrativeDetailHost() {
  const d = useDashboard();
  const { openId, close } = useNarrativeRoute();
  const narrative = openId ? d.narratives.find((n) => n.id === openId) : undefined;

  return (
    <Sheet open={!!narrative} onClose={close} label={narrative ? `Narrative: ${narrative.name}` : 'Narrative'}>
      {narrative && <NarrativeDetail key={narrative.id} narrative={narrative} onClose={close} />}
    </Sheet>
  );
}
