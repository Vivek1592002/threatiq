import { useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'motion/react';
import { useDialogBehavior } from '@/hooks/useDialogBehavior';
import s from './overlay.module.css';

interface SheetProps {
  open: boolean;
  onClose: () => void;
  label: string;
  children: ReactNode;
}

/** Full-screen takeover used for deep-dive views. */
export function Sheet(props: SheetProps) {
  return createPortal(<AnimatePresence>{props.open && <SheetInner {...props} />}</AnimatePresence>, document.body);
}

function SheetInner({ onClose, label, children }: SheetProps) {
  const ref = useRef<HTMLDivElement>(null);
  useDialogBehavior(true, ref, onClose);
  return (
    <motion.div
      ref={ref}
      role="dialog"
      aria-modal="true"
      aria-label={label}
      data-dialog-open="true"
      data-focus-self="true"
      tabIndex={-1}
      className={s.sheet}
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 24 }}
      transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
