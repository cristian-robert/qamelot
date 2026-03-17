const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5002';

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      ...(init?.body instanceof FormData ? {} : init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...init?.headers,
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as Record<string, string>).message ?? `HTTP ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export async function apiDownload(path: string, filename: string): Promise<void> {
  const res = await fetch(`${BASE}${path}`, { credentials: 'include' });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as Record<string, string>).message ?? `HTTP ${res.status}`);
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function apiUpload<T>(path: string, file: File): Promise<T> {
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    credentials: 'include',
    body: formData,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as Record<string, string>).message ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export function getBaseUrl(): string {
  return BASE;
}
