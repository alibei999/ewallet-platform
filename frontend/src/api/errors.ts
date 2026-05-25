import axios from 'axios';

interface ApiErrorBody {
  message?: string;
  error?: string;
}

export function getApiErrorMessage(err: unknown, fallback = 'Request failed.'): string {
  if (!axios.isAxiosError(err)) return fallback;
  const body = err.response?.data as ApiErrorBody | undefined;
  return body?.error ?? body?.message ?? fallback;
}
