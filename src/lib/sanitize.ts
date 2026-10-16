import type { PlatformKey } from '@/types/domain';

const PROFANITY = /\b(fuck(ing)?|shit|bitch|asshole|bastard)\b/gi;

/** Masks profanity in user-generated text before display. */
export function maskProfanity(s: string): string {
  return (s ?? '').replace(PROFANITY, (m) => m[0] + '*'.repeat(m.length - 1));
}

const ALLOWED_HOSTS = [
  'x.com',
  'twitter.com',
  'instagram.com',
  'youtube.com',
  'youtu.be',
  'google.com',
];

/**
 * Returns the URL only if it is https and points at a known platform host;
 * anything else (javascript:, data:, unknown domains) is rejected.
 */
export function safeExternalUrl(raw: string): string | null {
  try {
    const u = new URL(raw);
    if (u.protocol !== 'https:') return null;
    const host = u.hostname.replace(/^www\./, '');
    return ALLOWED_HOSTS.some((h) => host === h || host.endsWith(`.${h}`)) ? u.toString() : null;
  } catch {
    return null;
  }
}

/** Builds the profile URL for a handle on a platform. */
export function profileUrl(handle: string, platform: PlatformKey): string | null {
  const user = encodeURIComponent((handle ?? '').replace(/^@/, '').replace(/\s+/g, ''));
  if (!user) return null;
  switch (platform) {
    case 'x':
      return `https://x.com/${user}`;
    case 'instagram':
      return `https://instagram.com/${user}`;
    case 'youtube':
      return `https://youtube.com/@${user}`;
    default:
      return `https://www.google.com/search?q=${encodeURIComponent(handle)}`;
  }
}

/** Bounded, trimmed free-text input. */
export function cleanInput(s: string, max = 80): string {
  const printable = [...s].filter((ch) => {
    const c = ch.charCodeAt(0);
    return c >= 32 && c !== 127;
  });
  return printable.join('').replace(/\s+/g, ' ').trim().slice(0, max);
}
