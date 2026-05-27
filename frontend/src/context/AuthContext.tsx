import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import type { User } from '@/types';
import { jwtDecode } from 'jwt-decode';

interface JWTPayload {
  user_id: string;
  email: string;
  role: string;
  exp: number;
}

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (accessToken: string, refreshToken: string, user: User) => void;
  logout: () => void;
  setUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// Runs synchronously before the first render — no useEffect, no race condition.
function loadUserFromStorage(): User | null {
  try {
    const stored = localStorage.getItem('user');
    if (stored) return JSON.parse(stored) as User;
  } catch {
    localStorage.removeItem('user');
  }

  // Fallback: reconstruct from JWT without checking expiry.
  // Expired tokens are handled by the axios refresh interceptor when an API call
  // actually fails — not proactively on page load.
  const accessToken = localStorage.getItem('access_token');
  if (!accessToken) return null;
  try {
    const payload = jwtDecode<JWTPayload>(accessToken);
    const u: User = {
      id: Number(payload.user_id) || 0,
      email: payload.email,
      first_name: '',
      last_name: '',
      role: payload.role as User['role'],
      is_active: true,
    };
    localStorage.setItem('user', JSON.stringify(u));
    return u;
  } catch {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  // Synchronous initializer — user is known on the very first render.
  const [user, setUserState] = useState<User | null>(loadUserFromStorage);

  function login(accessToken: string, refreshTokenValue: string, u: User) {
    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('refresh_token', refreshTokenValue);
    localStorage.setItem('user', JSON.stringify(u));
    setUserState(u);
  }

  function logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    setUserState(null);
  }

  function setUser(u: User) {
    localStorage.setItem('user', JSON.stringify(u));
    setUserState(u);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: user !== null,
        isLoading: false,
        login,
        logout,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
