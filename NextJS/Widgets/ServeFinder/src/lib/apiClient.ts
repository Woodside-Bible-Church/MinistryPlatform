'use client';

interface ServeFinderWidgetConfig {
  apiBaseUrl?: string;
  containerId?: string;
}

declare global {
  interface Window {
    SERVE_FINDER_WIDGET_CONFIG?: ServeFinderWidgetConfig;
  }
}

function getApiBaseUrl(): string {
  if (typeof window !== 'undefined' && window.SERVE_FINDER_WIDGET_CONFIG) {
    return window.SERVE_FINDER_WIDGET_CONFIG.apiBaseUrl || 'https://serve-finder.vercel.app';
  }
  return '';
}

export function buildApiUrl(path: string): string {
  const baseUrl = getApiBaseUrl();
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  if (baseUrl) {
    return `${baseUrl}${normalizedPath}`;
  }
  return normalizedPath;
}

export function apiFetch(url: string, options?: RequestInit): Promise<Response> {
  const fullUrl = buildApiUrl(url);
  return fetch(fullUrl, options);
}
