import { createContext, useContext } from 'react';
import type { Dashboard } from '@/types/domain';

export const DashboardContext = createContext<Dashboard | null>(null);

/** Loaded dashboard. Only usable below the data gate in AppShell. */
export function useDashboard(): Dashboard {
  const d = useContext(DashboardContext);
  if (!d) throw new Error('useDashboard must be used inside <DashboardProvider>');
  return d;
}
