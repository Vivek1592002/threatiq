import { useQuery } from '@tanstack/react-query';
import { dashboardService } from './dashboard.service';

export const queryKeys = {
  dashboard: ['dashboard'] as const,
  indiaGeo: ['geo', 'india'] as const,
};

/** Dashboard refreshes on the pipeline cadence (6h); refetch every 15 min to stay close to "live". */
export function useDashboardQuery() {
  return useQuery({
    queryKey: queryKeys.dashboard,
    queryFn: ({ signal }) => dashboardService.getDashboard(signal),
    staleTime: 5 * 60_000,
    refetchInterval: 15 * 60_000,
  });
}

export function useIndiaGeoQuery() {
  return useQuery({
    queryKey: queryKeys.indiaGeo,
    queryFn: () => dashboardService.getIndiaGeo(),
    staleTime: Infinity,
    gcTime: Infinity,
  });
}
