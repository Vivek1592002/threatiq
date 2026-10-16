import { useState, type CSSProperties, type FormEvent } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Button, Select, TextInput } from '@/components/ui/controls';
import { Icon } from '@/components/ui/Icon';
import { useFeedback } from '@/store/feedback.store';
import { useTrackingStore } from '@/store/tracking.store';
import s from './narratives.module.css';

interface Props {
  selected: ReadonlySet<string>;
  clearSelection: () => void;
  groupFilter: string | null;
  setGroupFilter: (id: string | null) => void;
  groupView: boolean;
  setGroupView: (v: boolean) => void;
}

/** Buckets: user-defined groupings of narratives, plus the bulk-action bar. */
export function BucketBar({ selected, clearSelection, groupFilter, setGroupFilter, groupView, setGroupView }: Props) {
  const { buckets, membership, createBucket, assignToBucket, unassign, deleteBucket } = useTrackingStore();
  const toast = useFeedback((st) => st.toast);
  const askConfirm = useFeedback((st) => st.askConfirm);
  const [name, setName] = useState('');
  const [target, setTarget] = useState('');
  const count = selected.size;
  const members = [...selected];
  const targetId = buckets.some((b) => b.id === target) ? target : (buckets[0]?.id ?? '');

  const create = (e: FormEvent) => {
    e.preventDefault();
    const res = createBucket(name, members);
    if (!res.ok) return toast(res.reason ?? 'Could not create bucket.', 'warn');
    toast(`Created “${res.name}” with ${count} narrative${count !== 1 ? 's' : ''}.`, 'success');
    setName('');
    clearSelection();
  };

  return (
    <div className={s.bucketBar}>
      <div className={s.chips}>
        <span className={s.chipsLabel}>
          <Icon name="bucket" size={14} /> Buckets
        </span>
        {buckets.length === 0 ? (
          <span className={s.chipsEmpty}>None yet — tick narratives below to group them your way.</span>
        ) : (
          <>
            <button type="button" className={s.chip} aria-pressed={!groupFilter} onClick={() => setGroupFilter(null)}>
              All
            </button>
            {buckets.map((b) => {
              const n = Object.values(membership).filter((id) => id === b.id).length;
              const on = groupFilter === b.id;
              return (
                <span key={b.id} className={s.chipWrap} style={{ '--c': b.color } as CSSProperties}>
                  <button type="button" className={s.chip} aria-pressed={on} onClick={() => setGroupFilter(on ? null : b.id)} title={`Show only ${b.name}`}>
                    <span className={s.chipDot} />
                    {b.name}
                    <span className={s.chipCount}>{n}</span>
                  </button>
                  <button
                    type="button"
                    className={s.chipX}
                    aria-label={`Delete bucket ${b.name}`}
                    onClick={() =>
                      askConfirm({
                        title: 'Delete bucket?',
                        message: `Delete “${b.name}”? Narratives inside stay tracked — they just become ungrouped.`,
                        onConfirm: () => {
                          deleteBucket(b.id);
                          if (groupFilter === b.id) setGroupFilter(null);
                          toast(`Deleted bucket “${b.name}”.`);
                        },
                      })
                    }
                  >
                    <Icon name="close" size={11} strokeWidth={2.4} />
                  </button>
                </span>
              );
            })}
          </>
        )}
        <span className={s.spacer} />
        <Button size="sm" icon="layers" pressed={groupView} onClick={() => setGroupView(!groupView)}>
          Group by bucket
        </Button>
      </div>

      <AnimatePresence>
        {count > 0 && (
          <motion.div
            className={s.selBar}
            initial={{ opacity: 0, height: 0, marginTop: 0 }}
            animate={{ opacity: 1, height: 'auto', marginTop: 10 }}
            exit={{ opacity: 0, height: 0, marginTop: 0 }}
            transition={{ duration: 0.22 }}
          >
            <div className={s.selInner}>
              <span className={s.selCount}>
                <b className="num">{count}</b> selected
              </span>
              <form onSubmit={create} className={s.selGroup}>
                <TextInput inputSize="sm" value={name} onChange={(e) => setName(e.target.value)} placeholder="New bucket name…" aria-label="New bucket name" maxLength={40} />
                <Button size="sm" variant="primary" type="submit">
                  Create bucket
                </Button>
              </form>
              {buckets.length > 0 && (
                <div className={s.selGroup}>
                  <Select label="Bucket" value={targetId} options={buckets.map((b) => ({ value: b.id, label: b.name }))} onChange={setTarget} />
                  <Button
                    size="sm"
                    onClick={() => {
                      const b = buckets.find((x) => x.id === targetId);
                      if (!b) return;
                      assignToBucket(b.id, members);
                      toast(`Added ${count} to “${b.name}”.`, 'success');
                      clearSelection();
                    }}
                  >
                    Add to bucket
                  </Button>
                </div>
              )}
              <div className={s.selGroup}>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    unassign(members);
                    toast('Removed from bucket.');
                    clearSelection();
                  }}
                >
                  Remove from bucket
                </Button>
                <Button size="sm" variant="ghost" onClick={clearSelection}>
                  Clear
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
