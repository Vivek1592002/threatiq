import type { ReactNode } from 'react';
import type { Dashboard } from '@/types/domain';
import { DashboardContext } from './dashboard-context';

export function DashboardProvider({ value, children }: { value: Dashboard; children: ReactNode }) {
  return <DashboardContext.Provider value={value}>{children}</DashboardContext.Provider>;
}
