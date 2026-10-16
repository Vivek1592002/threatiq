/** Minimal, hardened JSON client used when a real backend is configured. */

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

const BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/+$/, '') ?? '';

export const hasRemoteApi = BASE_URL.length > 0;

export async function getJson<T>(path: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'GET',
    headers: { Accept: 'application/json' },
    credentials: 'same-origin',
    signal,
  });
  if (!res.ok) throw new ApiError(`Request failed (${res.status})`, res.status);
  const type = res.headers.get('content-type') ?? '';
  if (!type.includes('application/json')) throw new ApiError('Unexpected response type', res.status);
  return (await res.json()) as T;
}
