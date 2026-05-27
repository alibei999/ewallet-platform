import api from './axios';
import type { User } from '@/types';

interface AuthResponse {
  token: string;
  refresh_token: string;
  user: User;
}

interface RegisterPayload {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
}

interface LoginPayload {
  email: string;
  password: string;
}

export async function register(payload: RegisterPayload): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>('/auth/register', payload);
  return data;
}

export async function login(payload: LoginPayload): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>('/auth/login', payload);
  return data;
}

export async function logout(): Promise<void> {
  await api.post('/auth/logout');
}

export async function refreshToken(
  refreshTokenValue: string,
): Promise<Pick<AuthResponse, 'token' | 'refresh_token'>> {
  const { data } = await api.post<Pick<AuthResponse, 'token' | 'refresh_token'>>(
    '/auth/refresh',
    { refresh_token: refreshTokenValue },
  );
  return data;
}

export async function getMe(): Promise<User> {
  const { data } = await api.get<User>('/auth/me');
  return data;
}

export async function deleteAccount(): Promise<void> {
  await api.delete('/auth/account');
}
