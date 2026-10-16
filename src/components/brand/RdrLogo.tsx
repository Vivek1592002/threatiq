import { RdrMark } from './RdrMark';
import styles from './brand.module.css';

interface Props {
  tagline?: boolean;
  size?: number;
}

/** Mark + wordmark lockup. */
export function RdrLogo({ tagline = true, size = 36 }: Props) {
  return (
    <span className={styles.lockup}>
      <RdrMark size={size} />
      <span className={styles.words}>
        <span className={styles.wordmark}>
          Rdr<span className={styles.dot} aria-hidden="true" />
        </span>
        {tagline && <span className={styles.tagline}>Narrative radar</span>}
      </span>
    </span>
  );
}
