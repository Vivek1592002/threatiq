import { useSvgId } from '@/hooks/useSvgId';
import type { PlatformKey } from '@/types/domain';

interface Props {
  platform: PlatformKey;
  size?: number;
}

/** Brand marks for the four monitored channels. */
export function PlatformIcon({ platform, size = 16 }: Props) {
  const gid = useSvgId('ig');
  const common = { width: size, height: size, viewBox: '0 0 24 24', 'aria-hidden': true, focusable: false } as const;

  switch (platform) {
    case 'youtube':
      return (
        <svg {...common}>
          <rect x="1" y="4.5" width="22" height="15" rx="4.4" fill="#FF0033" />
          <path d="M10 9.1 15.2 12 10 14.9Z" fill="#fff" />
        </svg>
      );
    case 'instagram':
      return (
        <svg {...common}>
          <defs>
            <linearGradient id={gid} x1="0" y1="1" x2="1" y2="0">
              <stop offset="0" stopColor="#FEDA75" />
              <stop offset=".35" stopColor="#FA7E1E" />
              <stop offset=".65" stopColor="#D62976" />
              <stop offset="1" stopColor="#962FBF" />
            </linearGradient>
          </defs>
          <rect x="2.2" y="2.2" width="19.6" height="19.6" rx="5.8" fill={`url(#${gid})`} />
          <rect x="6.3" y="6.3" width="11.4" height="11.4" rx="5.7" fill="none" stroke="#fff" strokeWidth="1.8" />
          <circle cx="17.2" cy="6.8" r="1.2" fill="#fff" />
        </svg>
      );
    case 'x':
      return (
        <svg {...common}>
          <rect x="1.5" y="1.5" width="21" height="21" rx="5.5" style={{ fill: 'var(--ink)' }} />
          <path
            d="M15.9 6h2.1l-4.6 5.3 5.4 7.1h-4.2l-3.3-4.3-3.8 4.3H5.4l4.9-5.6L5.1 6h4.3l3 3.9L15.9 6Zm-.7 11.2h1.2L8.9 7.2H7.6l7.6 10Z"
            style={{ fill: 'var(--canvas)' }}
          />
        </svg>
      );
    case 'news':
      return (
        <svg {...common}>
          <rect x="1.5" y="1.5" width="21" height="21" rx="5.5" style={{ fill: 'var(--news)' }} />
          <rect x="5.5" y="7" width="5.5" height="4.6" rx="1" fill="#fff" />
          <path d="M13 7.6h5.5M13 10.8h5.5M5.5 14.4h13M5.5 17.2h9" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
  }
}
