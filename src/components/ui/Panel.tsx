import type { HTMLAttributes, ReactNode } from 'react';
import styles from './Panel.module.css';

interface PanelProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
  title?: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  flush?: boolean;
  as?: 'section' | 'div' | 'article';
}

export function Panel({ title, subtitle, actions, flush, as: Tag = 'section', className, children, ...rest }: PanelProps) {
  return (
    <Tag className={[styles.panel, flush && styles.flush, className].filter(Boolean).join(' ')} {...rest}>
      {(title || actions) && (
        <header className={styles.head}>
          <div className={styles.titles}>
            {title && <h3 className={styles.title}>{title}</h3>}
            {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
          </div>
          {actions && <div className={styles.actions}>{actions}</div>}
        </header>
      )}
      {children}
    </Tag>
  );
}

export function Eyebrow({ children, className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={[styles.eyebrow, className].filter(Boolean).join(' ')} {...rest}>
      {children}
    </div>
  );
}
