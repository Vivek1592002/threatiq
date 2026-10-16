import { create } from 'zustand';

export interface ToastItem {
  id: number;
  message: string;
  tone: 'info' | 'success' | 'warn';
}

export interface ConfirmRequest {
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
}

interface FeedbackState {
  toasts: ToastItem[];
  confirm: ConfirmRequest | null;
  toast: (message: string, tone?: ToastItem['tone']) => void;
  dismissToast: (id: number) => void;
  askConfirm: (req: ConfirmRequest) => void;
  closeConfirm: () => void;
}

let seq = 0;
const TOAST_MS = 4000;

export const useFeedback = create<FeedbackState>()((set, get) => ({
  toasts: [],
  confirm: null,
  toast: (message, tone = 'info') => {
    const id = ++seq;
    set((s) => ({ toasts: [...s.toasts.slice(-2), { id, message, tone }] }));
    setTimeout(() => get().dismissToast(id), TOAST_MS);
  },
  dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
  askConfirm: (confirm) => set({ confirm }),
  closeConfirm: () => set({ confirm: null }),
}));
