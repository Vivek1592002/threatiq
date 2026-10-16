import { useSvgId } from '@/hooks/useSvgId';
import styles from './brand.module.css';

interface Props {
  size?: number;
  /** rotating sweep beam */
  animated?: boolean;
  title?: string;
}

/**
 * Rdr mark — a radar scope: concentric range rings, a gradient sweep beam with
 * a bright leading edge, and a single detected blip.
 */
export function RdrMark({ size = 36, animated = true, title = 'Rdr' }: Props) {
  const id = useSvgId('rdr');
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" role="img" aria-label={title} className={styles.mark}>
      <defs>
        <linearGradient id={`${id}-bg`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#1d0a18" />
          <stop offset="1" stopColor="#06070d" />
        </linearGradient>
        <linearGradient id={`${id}-brand`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ff7a4d" />
          <stop offset=".5" stopColor="#f43c7b" />
          <stop offset="1" stopColor="#b8238f" />
        </linearGradient>
        <radialGradient id={`${id}-beam`} cx="24" cy="24" r="17" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#f43c7b" stopOpacity=".05" />
          <stop offset="1" stopColor="#ff5d7e" stopOpacity=".75" />
        </radialGradient>
        <filter id={`${id}-glow`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="1.3" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <clipPath id={`${id}-clip`}>
          <circle cx="24" cy="24" r="17" />
        </clipPath>
      </defs>

      <rect x="0.5" y="0.5" width="47" height="47" rx="13" fill={`url(#${id}-bg)`} />
      <rect x="0.5" y="0.5" width="47" height="47" rx="13" fill="none" stroke={`url(#${id}-brand)`} strokeOpacity=".55" />

      {/* range rings */}
      <circle cx="24" cy="24" r="17" fill="none" stroke={`url(#${id}-brand)`} strokeWidth="2" />
      <circle cx="24" cy="24" r="11.5" fill="none" stroke="#f43c7b" strokeOpacity=".38" strokeWidth="1.1" />
      <circle cx="24" cy="24" r="6" fill="none" stroke="#f43c7b" strokeOpacity=".3" strokeWidth="1.1" />
      <path d="M24 7v34M7 24h34" stroke="#f43c7b" strokeOpacity=".16" strokeWidth="1" />

      {/* sweep */}
      <g clipPath={`url(#${id}-clip)`}>
        <g className={animated ? styles.sweep : undefined}>
          <path d="M24 24 L24 7 A17 17 0 0 1 38.72 15.5 Z" fill={`url(#${id}-beam)`} />
          <line x1="24" y1="24" x2="38.72" y2="15.5" stroke="#ffd1df" strokeWidth="1.4" strokeLinecap="round" filter={`url(#${id}-glow)`} />
        </g>
      </g>

      {/* blip */}
      <circle cx="31.5" cy="14.6" r="2.4" fill="#fff" filter={`url(#${id}-glow)`} className={animated ? styles.blip : undefined} />
      <circle cx="24" cy="24" r="2.2" fill={`url(#${id}-brand)`} />
    </svg>
  );
}
