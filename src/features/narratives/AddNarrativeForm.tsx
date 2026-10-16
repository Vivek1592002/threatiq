import { useState, type FormEvent } from 'react';
import { Button, TextInput } from '@/components/ui/controls';
import { useFeedback } from '@/store/feedback.store';
import { useTrackingStore } from '@/store/tracking.store';
import s from './narratives.module.css';

export function AddNarrativeForm({ existing }: { existing: string[] }) {
  const [value, setValue] = useState('');
  const addPending = useTrackingStore((st) => st.addPending);
  const toast = useFeedback((st) => st.toast);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!value.trim()) return;
    const res = addPending(value, existing);
    setValue('');
    toast(
      res.ok ? `Now tracking “${res.name}”. First data will be available in about 1 hour.` : `“${res.name}” is already being tracked.`,
      res.ok ? 'success' : 'warn',
    );
  };

  return (
    <form className={s.addForm} onSubmit={submit} autoComplete="off">
      <TextInput
        icon="plus"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Track a new narrative…"
        aria-label="Add a narrative to track"
        maxLength={80}
        className={s.addInput}
      />
      <Button type="submit" variant="primary" disabled={!value.trim()}>
        Track narrative
      </Button>
    </form>
  );
}
