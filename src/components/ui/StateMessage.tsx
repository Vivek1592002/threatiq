import type { Tone } from '@/types/domain';
import { RdrMark } from '@/components/brand/RdrMark';
import { toneStyle } from '@/lib/style';
import { Button } from './controls';
import s from './state.module.css';

interface Props {
  title: string;
  message?: string;
  tone?: Tone;
  action?: { label: string; onClick: () => void };
  loading?: boolean;
}

export function StateMessage({ title, message, tone = 'acc', action, loading }: Props) {
  return (
    <div className={s.state} style={toneStyle(tone)} role={loading ? 'status' : 'alert'} aria-live="polite">
      <div className={s.scope}>
        <RdrMark size={64} animated={!!loading} title="" />
      </div>
      <h2 className={s.title}>{title}</h2>
      {message && <p className={s.message}>{message}</p>}
      {action && (
        <Button variant="primary" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
}
