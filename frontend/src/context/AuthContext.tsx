import {
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react';
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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const accessToken = localStorage.getItem('access_token');
    if (!accessToken) {
      setIsLoading(false);
      return;
    }
    try {
      const payload = jwtDecode<JWTPayload>(accessToken);
      const nowInSeconds = Math.floor(Date.now() / 1000);
      if (payload.exp <= nowInSeconds) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        setUserState(null);
        setIsLoading(false);
        return;
      }
      setUserState({
        id: Number(payload.user_id) || 0,
        email: payload.email,
        first_name: '',
        last_name: '',
        role: payload.role as User['role'],
        is_active: true,
      });
    } catch {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      setUserState(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  function login(accessToken: string, refreshTokenValue: string, u: User) {
    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('refresh_token', refreshTokenValue);
    setUserState(u);
  }

  function logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setUserState(null);
  }

  function setUser(u: User) {
    setUserState(u);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: user !== null,
        isLoading,
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
