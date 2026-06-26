"use client";
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { verifyToken, login as doLogin, initAuth, canAccess } from '@/lib/auth';
import type { TokenPayload, Role } from '@/lib/auth';

interface AuthCtx {
  user:    TokenPayload | null;
  loading: boolean;
  login:   (username: string, password: string) => Promise<boolean>;
  logout:  () => void;
  can:     (route: string) => boolean;
}

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user,    setUser]    = useState<TokenPayload | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initAuth().then(() => {
      const token = typeof window !== 'undefined' ? sessionStorage.getItem('agro_token') : null;
      if (token) {
        const payload = verifyToken(token);
        if (payload) setUser(payload);
        else sessionStorage.removeItem('agro_token');
      }
      setLoading(false);
    });
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    const result = await doLogin(username, password);
    if (result) {
      sessionStorage.setItem('agro_token', result.token);
      setUser(result.payload);
      return true;
    }
    return false;
  };

  const logout = () => {
    sessionStorage.removeItem('agro_token');
    setUser(null);
  };

  const can = (route: string) => user ? canAccess(user.role, route) : false;

  return <Ctx.Provider value={{ user, loading, login, logout, can }}>{children}</Ctx.Provider>;
}

export const useAuth = (): AuthCtx => {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAuth must be inside <AuthProvider>');
  return ctx;
};
