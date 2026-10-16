import type { ReactNode } from 'react';
import s from './charts.module.css';

interface Props {
  x: number;
  y: number;
  /** container width, used to keep the card on-screen */
  bound: number;
  below?: boolean;
  children: ReactNode;
}

export function ChartTooltip({ x, y, bound, below, children }: Props) {
  const left = Math.max(90, Math.min(bound - 90, x));
  return (
    <div className={[s.tip, below && s.tipBelow].filter(Boolean).join(' ')} style={{ left, top: y }} role="presentation">
      {children}
    </div>
  );
}

export const TipTitle = ({ children }: { children: ReactNode }) => <div className={s.tipTitle}>{children}</div>;
export const TipValue = ({ children }: { children: ReactNode }) => <div className={s.tipValue}>{children}</div>;
export const TipNote = ({ children }: { children: ReactNode }) => <div className={s.tipNote}>{children}</div>;
