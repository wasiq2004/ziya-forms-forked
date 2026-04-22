import { getApiUrl } from '@/lib/endpoints';

export { getApiUrl };

export function apiFetch(path: string, init?: RequestInit) {
  return fetch(getApiUrl(path), init);
}
