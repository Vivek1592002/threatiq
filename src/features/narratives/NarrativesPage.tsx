import { useCallback, useMemo, useState } from 'react';
import { useDashboard } from '@/app/dashboard-context';
import { PageHeader } from '@/components/ui/PageHeader';
import { Panel } from '@/components/ui/Panel';
import { useNarrativeRoute } from '@/features/narrative-detail/useNarrativeRoute';
import { useFeedback } from '@/store/feedback.store';
import { useTrackingStore } from '@/store/tracking.store';
import { AddNarrativeForm } from './AddNarrativeForm';
import { BucketBar } from './BucketBar';
import { FilterBar } from './FilterBar';
import { applyFilters, useNarrativeFilters } from './filtering';
import { NarrativeTable, type Group } from './NarrativeTable';
import page from '@/components/ui/page.module.css';

export default function NarrativesPage() {
  const d = useDashboard();
  const { open } = useNarrativeRoute();
  const { filters, update, reset, isDefault } = useNarrativeFilters();
  const { removed, pending, buckets, membership, removeNarrative, removePending } = useTrackingStore();
  const toast = useFeedback((st) => st.toast);
  const askConfirm = useFeedback((st) => st.askConfirm);

  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const [groupView, setGroupView] = useState(false);
  const [groupFilter, setGroupFilter] = useState<string | null>(null);

  const bucketOf = useCallback((name: string) => buckets.find((b) => b.id === membership[name]), [buckets, membership]);
  const activeGroup = groupFilter && buckets.some((b) => b.id === groupFilter) ? groupFilter : null;

  const rows = useMemo(() => {
    const visible = d.narratives.filter((n) => !removed.includes(n.name));
    const scoped = activeGroup ? visible.filter((n) => membership[n.name] === activeGroup) : visible;
    return applyFilters(scoped, filters);
  }, [d.narratives, removed, activeGroup, membership, filters]);

  const groups: Group[] = useMemo(() => {
    if (!groupView) return [{ key: 'all', label: '', color: null, rows }];
    const out: Group[] = buckets
      .map((b) => ({ key: b.id, label: b.name, color: b.color, rows: rows.filter((n) => membership[n.name] === b.id) }))
      .filter((g) => g.rows.length > 0);
    const ungrouped = rows.filter((n) => !bucketOf(n.name));
    if (ungrouped.length) out.push({ key: 'none', label: 'Ungrouped', color: null, rows: ungrouped });
    return out;
  }, [groupView, rows, buckets, membership, bucketOf]);

  const q = filters.q.toLowerCase().trim();
  const visiblePending = activeGroup ? [] : pending.filter((x) => !q || x.name.toLowerCase().includes(q));

  const toggle = (name: string, on: boolean) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (on) next.add(name);
      else next.delete(name);
      return next;
    });

  const toggleAll = (on: boolean) =>
    setSelected((prev) => {
      const next = new Set(prev);
      for (const n of rows) {
        if (on) next.add(n.name);
        else next.delete(n.name);
      }
      return next;
    });

  const confirmDelete = (name: string, isPending: boolean) =>
    askConfirm({
      title: 'Stop tracking?',
      message: `Delete “${name}” from tracking? This can't be undone.`,
      onConfirm: () => {
        if (isPending) removePending(name);
        else {
          removeNarrative(name);
          toggle(name, false);
        }
        toast(`Removed “${name}” from tracking.`);
      },
    });

  return (
    <>
      <PageHeader
        eyebrow={`${rows.length + visiblePending.length} tracked`}
        title="Narrative intelligence"
        subtitle="Volume, velocity and 24-hour projection · open any narrative for the full deep-dive"
        actions={<AddNarrativeForm existing={d.narratives.map((n) => n.name)} />}
      />
      <div className={page.stack} style={{ gap: 12 }}>
        <FilterBar filters={filters} onChange={update} onReset={reset} canReset={!isDefault} />
        <BucketBar
          selected={selected}
          clearSelection={() => setSelected(new Set())}
          groupFilter={activeGroup}
          setGroupFilter={setGroupFilter}
          groupView={groupView}
          setGroupView={setGroupView}
        />
        <Panel flush>
          <NarrativeTable
            groups={groups}
            pending={visiblePending}
            bucketOf={bucketOf}
            selected={selected}
            onToggle={toggle}
            onToggleAll={toggleAll}
            sort={filters.sort}
            onSort={(sort) => update({ sort })}
            onOpen={(n) => open(n.id)}
            onDelete={confirmDelete}
            onPendingClick={(name) => toast(`Collecting data for “${name}”. First results become available in about 1 hour.`)}
          />
        </Panel>
      </div>
    </>
  );
}
