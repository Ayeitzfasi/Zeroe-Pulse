'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { User } from '@zeroe-pulse/shared';
import { api } from '@/lib/api';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = async () => {
    const token = api.getToken();
    if (!token) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    const result = await api.getMe();
    if (result.success && result.data) {
      setUser(result.data);
    } else {
      // Token is invalid, clear it
      api.setToken(null);
      setUser(null);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (email: string, password: string) => {
    const result = await api.login({ email, password });

    if (result.success && result.data) {
      setUser(result.data.user);
      return { success: true };
    }

    return {
      success: false,
      error: result.error?.message || 'Login failed',
    };
  };

  const logout = () => {
    api.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
