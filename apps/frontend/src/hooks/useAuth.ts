'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '../lib/api';

export interface AuthUser {
  id: string;
  email: string;
  role: 'PATIENT' | 'DOCTOR' | 'MODERATOR' | 'ADMIN';
  name: string;
  profile?: any;
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Hydrate user from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (stored && token) {
      setUser(JSON.parse(stored));
    }
    setLoading(false);
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const data = await authApi.login(email, password);
      localStorage.setItem('user', JSON.stringify(data.user));
      localStorage.setItem('token', data.token);
      setUser(data.user);

      // Role-based redirect
      const roleRoutes: Record<string, string> = {
        PATIENT: '/dashboard/patient',
        DOCTOR: '/dashboard/doctor',
        MODERATOR: '/dashboard/moderator',
        ADMIN: '/dashboard/admin',
      };
      router.push(roleRoutes[data.user.role] ?? '/');
    },
    [router]
  );

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch (_) {
      // ignore
    }
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setUser(null);
    router.push('/');
  }, [router]);

  const requireAuth = useCallback(
    (allowedRoles?: string[]) => {
      if (loading) return;
      if (!user) {
        router.push('/');
        return;
      }
      if (allowedRoles && !allowedRoles.includes(user.role)) {
        router.push('/unauthorized');
      }
    },
    [user, loading, router]
  );

  return { user, loading, login, logout, requireAuth };
}
