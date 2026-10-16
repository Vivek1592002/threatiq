import s from './charts.module.css';

interface Props {
  pos: number;
  neu: number;
  neg: number;
  height?: number;
}

export function SentimentBar({ pos, neu, neg, height = 6 }: Props) {
  const total = pos + neu + neg || 1;
  return (
    <div
      className={s.sent}
      style={{ height }}
      role="img"
      aria-label={`Sentiment: ${pos}% positive, ${neu}% neutral, ${neg}% negative`}
    >
      <i style={{ width: `${(100 * pos) / total}%`, background: 'var(--pos)' }} />
      <i style={{ width: `${(100 * neu) / total}%`, background: 'var(--neu)', opacity: 0.6 }} />
      <i style={{ width: `${(100 * neg) / total}%`, background: 'var(--neg)' }} />
    </div>
  );
}
