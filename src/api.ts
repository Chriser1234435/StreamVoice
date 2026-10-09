type ApiResult<T = any> = { data: T };

async function request<T = any>(method: string, path: string, body?: unknown): Promise<ApiResult<T>> {
  const response = await fetch(path, {
    method,
    credentials: 'include',
    headers: body === undefined ? { Accept: 'application/json' } : {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const contentType = response.headers.get('content-type') || '';
  const payload = contentType.includes('application/json')
    ? await response.json()
    : await response.text();
  if (!response.ok) {
    const error: any = new Error(
      typeof payload === 'object' && payload
        ? String(payload.message || payload.error || 'Request failed')
        : String(payload || 'Request failed')
    );
    error.response = { status: response.status, data: payload };
    throw error;
  }
  return { data: payload as T };
}

export const api = {
  get: <T = any>(path: string) => request<T>('GET', path),
  post: <T = any>(path: string, body?: unknown) => request<T>('POST', path, body),
  put: <T = any>(path: string, body?: unknown) => request<T>('PUT', path, body),
  delete: <T = any>(path: string, body?: unknown) => request<T>('DELETE', path, body),
};
