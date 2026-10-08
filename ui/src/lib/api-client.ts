import Axios, { AxiosError } from 'axios';
import { getToken, requireAuth } from './auth';

export class ApiError extends Error {
  status?: number;
  details?: Record<string, unknown>;

  constructor(message: string, status?: number, details?: Record<string, unknown>) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

type ErrorBody = { error?: string; status?: string; data?: Record<string, unknown> };

export const api = Axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api/v1',
});

api.interceptors.request.use(config => {
  const token = getToken();
  if (token) {
    config.headers.set('Authorization', `Bearer ${token}`);
  }
  return config;
});

api.interceptors.response.use(
  response => {
    return response.data;
  },
  (error: unknown) => {
    if (Axios.isCancel(error)) return Promise.reject(error);

    if (error instanceof AxiosError) {
      const body = error.response?.data as ErrorBody | undefined;
      const status = error.response?.status;
      if (status === 401) requireAuth();

      const details =
        body && typeof body.data === 'object' && body.data !== null ? body.data : undefined;
      const message = (typeof body?.error === 'string' && body.error) || error.message;
      return Promise.reject(new ApiError(message, status, details));
    }

    return Promise.reject(
      error instanceof Error ? new ApiError(error.message) : new ApiError('Unknown error')
    );
  }
);

/** Turns any thrown value into display lines (message first, then field details). */
export function describeError(error: unknown): { message: string; details: string[] } {
  if (error instanceof ApiError) {
    const details = Object.entries(error.details ?? {}).map(([key, value]) => {
      const text = typeof value === 'string' ? value : JSON.stringify(value);
      return ['body', 'params', 'query'].includes(key) ? text : `${key}: ${text}`;
    });
    return { message: error.message, details };
  }
  if (error instanceof Error) return { message: error.message, details: [] };
  return { message: 'Something went wrong', details: [] };
}
