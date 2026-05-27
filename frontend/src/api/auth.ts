import api from './axios';
import type { User } from '@/types';

interface ApiEnvelope<T> {
  success: boolean;
  message?: string;
  data: T;
}

interface BackendUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  is_verified: boolean;
}

interface BackendAuthData {
  access_token: string;
  refresh_token: string;
  user: BackendUser;
}

export interface AuthResponse {
  access_token: string;
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

function mapUser(bu: BackendUser): User {
  return {
    id: 0,
    email: bu.email,
    first_name: bu.first_name,
    last_name: bu.last_name,
    role: bu.role as User['role'],
    is_active: true,
  };
}

export async function register(payload: RegisterPayload): Promise<AuthResponse> {
  const { data } = await api.post<ApiEnvelope<BackendAuthData>>('/auth/register', payload);
  return {
    access_token: data.data.access_token,
    refresh_token: data.data.refresh_token,
    user: mapUser(data.data.user),
  };
}

export async function login(payload: LoginPayload): Promise<AuthResponse> {
  const { data } = await api.post<ApiEnvelope<BackendAuthData>>('/auth/login', payload);
  return {
    access_token: data.data.access_token,
    refresh_token: data.data.refresh_token,
    user: mapUser(data.data.user),
  };
}

export async function logout(): Promise<void> {
  await api.post('/auth/logout');
}

export async function refreshToken(
  refreshTokenValue: string,
): Promise<{ access_token: string; refresh_token: string }> {
  const { data } = await api.post<ApiEnvelope<BackendAuthData>>(
    '/auth/refresh',
    { refresh_token: refreshTokenValue },
  );
  return {
    access_token: data.data.access_token,
    refresh_token: data.data.refresh_token,
  };
}

export async function getMe(): Promise<User> {
  const { data } = await api.get<ApiEnvelope<BackendUser>>('/auth/me');
  return mapUser(data.data);
}

export async function deleteAccount(): Promise<void> {
  await api.delete('/auth/account');
}
