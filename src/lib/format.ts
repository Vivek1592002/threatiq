const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const;

/** Compact number: 1.2M, 34.5K, 812. */
export function compact(n: number): string {
  const v = Number(n);
  const abs = Math.abs(v);
  if (abs >= 1e6) return `${(v / 1e6).toFixed(1)}M`;
  if (abs >= 1e3) return `${(v / 1e3).toFixed(1)}K`;
  return Math.round(v).toLocaleString('en-US');
}

/** Full number, Indian digit grouping (2,26,630). */
export function full(n: number): string {
  return Math.round(n).toLocaleString('en-IN');
}

export function signed(n: number, suffix = ''): string {
  return `${n > 0 ? '+' : ''}${n}${suffix}`;
}

export function signedCompact(n: number): string {
  return `${n > 0 ? '+' : ''}${compact(n)}`;
}

function parseDay(iso: string): Date {
  return new Date(`${iso}T00:00`);
}

/** "18 Oct '25" */
export function dayLabel(iso: string): string {
  const d = parseDay(iso);
  return `${d.getDate()} ${MONTHS[d.getMonth()]} '${String(d.getFullYear()).slice(2)}`;
}

/** "18 Oct" */
export function dayMonth(iso: string): string {
  const d = parseDay(iso);
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

export function monthOf(iso: string): number {
  return parseDay(iso).getMonth();
}

export function monthName(m: number): string {
  return MONTHS[m] ?? '';
}

/** "12 Oct · 18:00" → "12 Oct" */
export function cycleDay(label: string): string {
  return (label.split('·')[0] ?? '').trim();
}
