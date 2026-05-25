import api from './axios';
import type { User } from '@/types';

// Backend wraps every response: { success, message, data: <payload> }
interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}

// Exact shape the backend returns for auth endpoints
interface BackendUserInfo {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  is_verified: boolean;
}

interface BackendAuthPayload {
  access_token: string;
  refresh_token: string;
  user: BackendUserInfo;
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

function toUser(u: BackendUserInfo): User {
  return {
    id: Number(u.id) || 0,
    email: u.email,
    first_name: u.first_name,
    last_name: u.last_name,
    role: u.role as User['role'],
    is_active: u.is_verified,
  };
}

export async function register(payload: RegisterPayload): Promise<AuthResponse> {
  const { data } = await api.post<ApiEnvelope<BackendAuthPayload>>('/auth/register', payload);
  return { ...data.data, user: toUser(data.data.user) };
}

export async function login(payload: LoginPayload): Promise<AuthResponse> {
  const { data } = await api.post<ApiEnvelope<BackendAuthPayload>>('/auth/login', payload);
  return { ...data.data, user: toUser(data.data.user) };
}

export async function logout(): Promise<void> {
  await api.post('/auth/logout');
}

export async function refreshToken(
  refreshTokenValue: string,
): Promise<Pick<AuthResponse, 'access_token' | 'refresh_token'>> {
  const { data } = await api.post<ApiEnvelope<Pick<BackendAuthPayload, 'access_token' | 'refresh_token'>>>(
    '/auth/refresh',
    { refresh_token: refreshTokenValue },
  );
  return data.data;
}

export async function getMe(): Promise<User> {
  const { data } = await api.get<ApiEnvelope<BackendUserInfo>>('/auth/me');
  return toUser(data.data);
}

export async function deleteAccount(): Promise<void> {
  await api.delete('/auth/account');
}
