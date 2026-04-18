const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '');

function normalizePath(path: string) {
  return path.startsWith('/') ? path : `/${path}`;
}

export function getApiUrl(path: string) {
  const normalizedPath = normalizePath(path);

  if (!API_BASE_URL) {
    return normalizedPath;
  }

  if (API_BASE_URL.endsWith('/api') && normalizedPath.startsWith('/api/')) {
    return `${API_BASE_URL}${normalizedPath.slice('/api'.length)}`;
  }

  return `${API_BASE_URL}${normalizedPath}`;
}

export function apiFetch(path: string, init?: RequestInit) {
  return fetch(getApiUrl(path), init);
}
