import { cycleDay, dayMonth, monthName, monthOf } from '@/lib/format';
import type { XTick } from './TimeSeriesChart';

/** Day labels for short windows, month labels for long ones. */
export function dailyTicks(series: { date: string }[]): XTick[] {
  const n = series.length;
  if (n === 0) return [];
  if (n <= 46) {
    const step = Math.max(1, Math.round(n / 7));
    const ticks: XTick[] = [];
    series.forEach((d, i) => {
      if (i % step === 0) ticks.push({ at: i, label: dayMonth(d.date) });
    });
    const lastTick = ticks[ticks.length - 1];
    if (lastTick && n - 1 - lastTick.at >= step / 2) ticks.push({ at: n - 1, label: dayMonth(series[n - 1]!.date) });
    return ticks;
  }
  const ticks: XTick[] = [];
  let prev = -1;
  const minGap = Math.max(10, Math.round(n / 14));
  series.forEach((d, i) => {
    const m = monthOf(d.date);
    if (m !== prev) {
      prev = m;
      const lastAt = ticks[ticks.length - 1]?.at ?? -Infinity;
      if (i > 2 && i - lastAt >= minGap) ticks.push({ at: i, label: monthName(m) });
    }
  });
  return ticks;
}

/** Every 4th 6-hour cycle (one per day) plus the latest. */
/** Drops ticks closer than `minGap` px so labels never collide on narrow charts. */
export function thinTicks(ticks: XTick[], toX: (at: number) => number, minGap = 46): XTick[] {
  const out: XTick[] = [];
  for (const t of ticks) {
    const prev = out[out.length - 1];
    if (!prev || toX(t.at) - toX(prev.at) >= minGap) out.push(t);
  }
  return out;
}

export function cycleTicks(labels: string[]): XTick[] {
  const n = labels.length;
  return labels.flatMap((l, i) => (i % 4 === 0 || i === n - 1 ? [{ at: i, label: cycleDay(l) }] : [])).filter(
    (t, i, arr) => i === 0 || t.at - arr[i - 1]!.at >= 2,
  );
}
