import { AnimatePresence, motion } from 'motion/react';
import { useFeedback } from '@/store/feedback.store';
import type { Tone } from '@/types/domain';
import { toneStyle } from '@/lib/style';
import { Button } from './controls';
import { Modal } from './Modal';
import s from './overlay.module.css';

const TOAST_TONE: Record<string, Tone> = { info: 'acc', success: 'pos', warn: 'warn' };

/** Renders the global toast stack and confirmation dialog. Mount once. */
export function FeedbackHost() {
  const toasts = useFeedback((st) => st.toasts);
  const confirm = useFeedback((st) => st.confirm);
  const closeConfirm = useFeedback((st) => st.closeConfirm);

  return (
    <>
      <div className={s.toaster} role="status" aria-live="polite">
        <AnimatePresence initial={false}>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              layout
              className={s.toast}
              style={toneStyle(TOAST_TONE[t.tone] ?? 'acc')}
              initial={{ opacity: 0, y: 16, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.97 }}
              transition={{ duration: 0.22 }}
            >
              <span className={s.toastDot} />
              <span>{t.message}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <Modal open={!!confirm} onClose={closeConfirm} title={confirm?.title ?? ''} size="sm" role="alertdialog" eyebrow="Confirm">
        <p className={s.confirmMsg}>{confirm?.message}</p>
        <div className={s.confirmActions}>
          <Button variant="ghost" onClick={closeConfirm} data-autofocus>
            Cancel
          </Button>
          <Button
            variant="danger"
            icon="trash"
            onClick={() => {
              const fn = confirm?.onConfirm;
              closeConfirm();
              fn?.();
            }}
          >
            {confirm?.confirmLabel ?? 'Delete'}
          </Button>
        </div>
      </Modal>
    </>
  );
}
