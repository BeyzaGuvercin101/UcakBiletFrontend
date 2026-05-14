export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080').replace(/\/$/, '');
const API_TIMEOUT_MS = Number(import.meta.env.VITE_API_TIMEOUT_MS || 15000);

export interface ApiEnvelope<T> {
  data?: T;
  payload?: T;
  message?: string;
  errorMessage?: string | null;
  status?: number;
}

interface ApiRequestOptions {
  method?: string;
  body?: unknown;
  auth?: boolean;
  headers?: HeadersInit;
  query?: Record<string, string | number | boolean | undefined | null>;
  signal?: AbortSignal;
}

const AUTH_TOKEN_KEY = 'accessToken';

export const getAccessToken = () => localStorage.getItem(AUTH_TOKEN_KEY) || '';

export const setAccessToken = (token: string) => {
  localStorage.setItem(AUTH_TOKEN_KEY, token);
};

export const clearAccessToken = () => {
  localStorage.removeItem(AUTH_TOKEN_KEY);
};

export const createAuthHeaders = (headers: HeadersInit = {}) => {
  const requestHeaders = new Headers(headers);
  const token = getAccessToken();

  if (token) {
    requestHeaders.set('Authorization', `Bearer ${token}`);
  }

  return requestHeaders;
};

export const buildApiUrl = (
  path: string,
  query?: ApiRequestOptions['query'],
) => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const url = new URL(`${API_BASE_URL}${normalizedPath}`);

  Object.entries(query || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, String(value));
    }
  });

  return url.toString();
};

const isApiEnvelope = (value: unknown): value is ApiEnvelope<unknown> => (
  !!value &&
  typeof value === 'object' &&
  (
    'data' in value ||
    'payload' in value ||
    'message' in value ||
    'errorMessage' in value ||
    'status' in value
  )
);

export const normalizeApiEnvelope = <T>(body: unknown, fallbackStatus?: number): ApiEnvelope<T> => {
  if (isApiEnvelope(body)) {
    const value = (body.data ?? body.payload) as T | undefined;

    return {
      ...body,
      data: value,
      payload: value,
      status: typeof body.status === 'number' ? body.status : fallbackStatus,
    } as ApiEnvelope<T>;
  }

  return {
    data: body as T,
    payload: body as T,
    status: fallbackStatus,
  };
};

export const getApiData = <T>(response: ApiEnvelope<T>) => response.data ?? response.payload;

const extractNestedErrorMessage = (body: unknown): string | undefined => {
  if (!body || typeof body !== 'object') return undefined;

  const record = body as Record<string, unknown>;

  if (typeof record.errorMessage === 'string' && record.errorMessage.trim()) {
    return record.errorMessage;
  }

  if (typeof record.message === 'string' && record.message.trim()) {
    return record.message;
  }

  const exception = record.exception;
  if (exception && typeof exception === 'object') {
    const exceptionRecord = exception as Record<string, unknown>;
    if (typeof exceptionRecord.message === 'string' && exceptionRecord.message.trim()) {
      return exceptionRecord.message;
    }
  }

  return undefined;
};

export async function readApiResponse<T>(response: Response): Promise<ApiEnvelope<T>> {
  const contentType = response.headers.get('content-type') || '';
  const rawBody = response.status === 204
    ? null
    : contentType.includes('application/json')
      ? await response.json()
      : await response.text();

  const responseBody = normalizeApiEnvelope<T>(rawBody, response.status);
  const extractedErrorMessage = extractNestedErrorMessage(rawBody);

  const envelopeStatus =
    typeof responseBody.status === 'number' && Number.isFinite(responseBody.status)
      ? responseBody.status
      : undefined;

  if (!response.ok || (envelopeStatus !== undefined && envelopeStatus >= 400)) {
    throw new Error(
      extractedErrorMessage ||
      responseBody.errorMessage ||
      responseBody.message ||
      `API istegi basarisiz: ${response.status}`,
    );
  }

  return responseBody;
}

export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<ApiEnvelope<T>> {
  const {
    method = 'GET',
    body,
    auth = true,
    headers = {},
    query,
    signal,
  } = options;
  const requestHeaders = auth ? createAuthHeaders(headers) : new Headers(headers);

  if (body !== undefined && !(body instanceof FormData)) {
    requestHeaders.set('Content-Type', 'application/json');
  }

  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), API_TIMEOUT_MS);

  if (signal) {
    signal.addEventListener('abort', () => controller.abort(), { once: true });
  }

  try {
    const response = await fetch(buildApiUrl(path, query), {
      method,
      credentials: 'include',
      headers: requestHeaders,
      body: body === undefined
        ? undefined
        : body instanceof FormData
          ? body
          : JSON.stringify(body),
      signal: controller.signal,
    });

    return await readApiResponse<T>(response);
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('API istegi zaman asimina ugradi. Backend servisinin calistigini kontrol edin.');
    }

    throw error;
  } finally {
    window.clearTimeout(timeout);
  }
}
