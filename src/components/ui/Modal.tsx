import { useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'motion/react';
import { useDialogBehavior } from '@/hooks/useDialogBehavior';
import { cx } from '@/lib/style';
import { IconButton } from './controls';
import { Eyebrow } from './Panel';
import s from './overlay.module.css';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  eyebrow?: ReactNode;
  size?: 'md' | 'sm';
  role?: 'dialog' | 'alertdialog';
  children: ReactNode;
}

export function Modal(props: ModalProps) {
  return createPortal(<AnimatePresence>{props.open && <ModalInner {...props} />}</AnimatePresence>, document.body);
}

function ModalInner({ onClose, title, eyebrow, size = 'md', role = 'dialog', children }: ModalProps) {
  const ref = useRef<HTMLDivElement>(null);
  useDialogBehavior(true, ref, onClose);
  return (
    <>
      <motion.div className={s.scrim} onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
      <div className={s.modalWrap}>
        <motion.div
          ref={ref}
          role={role}
          aria-modal="true"
          aria-label={typeof title === 'string' ? title : undefined}
          data-dialog-open="true"
          tabIndex={-1}
          className={cx(s.modal, size === 'sm' && s.modalSm)}
          initial={{ opacity: 0, y: 18, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.98 }}
          transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
        >
          <header className={s.modalHead}>
            <div>
              {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
              <h2 className={s.modalTitle}>{title}</h2>
            </div>
            <IconButton icon="close" label="Close" onClick={onClose} />
          </header>
          <div className={s.modalBody}>{children}</div>
        </motion.div>
      </div>
    </>
  );
}
