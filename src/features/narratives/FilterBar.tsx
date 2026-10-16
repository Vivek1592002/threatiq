import { Button, Select, TextInput } from '@/components/ui/controls';
import { LEAN_OPTIONS, SORT_OPTIONS, STATUS_OPTIONS, TYPE_OPTIONS, type NarrativeFilters } from './filtering';
import s from './narratives.module.css';

interface Props {
  filters: NarrativeFilters;
  onChange: (patch: Partial<NarrativeFilters>) => void;
  onReset: () => void;
  canReset: boolean;
}

export function FilterBar({ filters, onChange, onReset, canReset }: Props) {
  return (
    <div className={s.filters} role="search">
      <TextInput
        icon="search"
        inputSize="sm"
        className={s.search}
        value={filters.q}
        onChange={(e) => onChange({ q: e.target.value })}
        placeholder="Search narratives…"
        aria-label="Search narratives"
        maxLength={80}
      />
      <Select label="Filter by type" value={filters.type} options={TYPE_OPTIONS} onChange={(type) => onChange({ type })} />
      <Select label="Filter by status" value={filters.status} options={STATUS_OPTIONS} onChange={(status) => onChange({ status })} />
      <Select label="Filter by sentiment lean" value={filters.lean} options={LEAN_OPTIONS} onChange={(lean) => onChange({ lean })} />
      <Select label="Sort by" value={filters.sort} options={SORT_OPTIONS} onChange={(sort) => onChange({ sort })} />
      <Button variant="ghost" size="sm" icon="reset" onClick={onReset} disabled={!canReset}>
        Reset
      </Button>
    </div>
  );
}
