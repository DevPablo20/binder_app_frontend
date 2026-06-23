import { useQuery } from '@tanstack/react-query';
import type { ReactNode } from 'react';

import { ApiError } from '@/api/client';
import { getMe } from '@/api/user';
import { AuthContext, type AuthContextValue } from '@/auth/authContext';

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      try {
        return await getMe();
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          return null;
        }
        throw error;
      }
    },
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  const value: AuthContextValue = {
    user: data ?? null,
    isAuthenticated: !!data,
    isLoading,
    refetch: () => {
      void refetch();
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
