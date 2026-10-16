import type { AnchorHTMLAttributes, ReactNode } from 'react';
import { safeExternalUrl } from '@/lib/sanitize';

interface Props extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href' | 'target' | 'rel'> {
  href: string | null;
  children: ReactNode;
}

/** Opens only allow-listed https URLs, isolated from this window. Falls back to plain text. */
export function ExternalLink({ href, children, ...rest }: Props) {
  const safe = href ? safeExternalUrl(href) : null;
  if (!safe) return <span className={rest.className}>{children}</span>;
  return (
    <a href={safe} target="_blank" rel="noopener noreferrer nofollow" referrerPolicy="no-referrer" {...rest}>
      {children}
    </a>
  );
}
