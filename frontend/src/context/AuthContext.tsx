import {
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react';
import type { ReactNode } from 'react';
import type { User } from '@/types';
import { getMe } from '@/api/auth';

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, refreshToken: string, user: User) => void;
  logout: () => void;
  setUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setIsLoading(false);
      return;
    }
    getMe()
      .then((u) => setUserState(u))
      .catch(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
      })
      .finally(() => setIsLoading(false));
  }, []);

  function login(token: string, refreshTokenValue: string, u: User) {
    localStorage.setItem('token', token);
    localStorage.setItem('refreshToken', refreshTokenValue);
    setUserState(u);
  }

  function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
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
