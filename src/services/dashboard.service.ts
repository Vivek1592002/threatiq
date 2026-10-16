import type { FeatureCollection, Geometry } from 'geojson';
import type { RawDashboard } from '@/types/api.types';
import type { Dashboard } from '@/types/domain';
import { getJson, hasRemoteApi } from './http';
import { normalizeDashboard } from './normalize';

export type IndiaGeo = FeatureCollection<Geometry, { st: string }>;

/** Simulated network latency for the mock backend, so loading states are exercised. */
const MOCK_LATENCY_MS = 450;

const delay = (ms: number, signal?: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    const t = setTimeout(resolve, ms);
    signal?.addEventListener('abort', () => {
      clearTimeout(t);
      reject(new DOMException('Aborted', 'AbortError'));
    });
  });

/**
 * Single seam between the UI and the data source. Set `VITE_API_BASE_URL`
 * to point at the real pipeline; otherwise the bundled dummy dataset is used.
 */
export const dashboardService = {
  async getDashboard(signal?: AbortSignal): Promise<Dashboard> {
    if (hasRemoteApi) return normalizeDashboard(await getJson<RawDashboard>('/v1/dashboard', signal));
    const [mod] = await Promise.all([import('@/mocks/raw/dashboard.json'), delay(MOCK_LATENCY_MS, signal)]);
    return normalizeDashboard(mod.default as unknown as RawDashboard);
  },

  async getIndiaGeo(): Promise<IndiaGeo> {
    const mod = await import('@/mocks/raw/india.geo.json');
    return mod.default as unknown as IndiaGeo;
  },
};
