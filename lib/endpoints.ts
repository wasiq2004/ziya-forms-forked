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

export function getNextAuthBasePath() {
  const explicitBasePath = (process.env.NEXT_PUBLIC_NEXTAUTH_BASE_PATH || '').replace(/\/$/, '');

  if (explicitBasePath) {
    return explicitBasePath;
  }

  if (!API_BASE_URL) {
    return '/api/auth';
  }

  if (/^https?:\/\//i.test(API_BASE_URL)) {
    return `${API_BASE_URL}/api/auth`;
  }

  if (API_BASE_URL.endsWith('/api')) {
    return `${API_BASE_URL}/auth`;
  }

  return `${API_BASE_URL}/api/auth`;
}
