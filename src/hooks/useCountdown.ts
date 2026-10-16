import { useEffect, useState } from 'react';

function format(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(s / 3600)}h ${String(Math.floor((s % 3600) / 60)).padStart(2, '0')}m`;
}

/**
 * Time until the next pipeline refresh. The demo dataset's refresh time is in
 * the past, so we fall back to rolling within the cadence window.
 */
export function useCountdown(nextRefreshIso: string, cadenceHours: number): string {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  const cadenceMs = cadenceHours * 3_600_000;
  const target = Date.parse(nextRefreshIso.replace(' IST', ':00+05:30').replace(' ', 'T'));
  let left = Number.isFinite(target) ? target - now : NaN;
  if (!(left > 0 && left <= cadenceMs)) left = cadenceMs - (now % cadenceMs);
  return format(left);
}
