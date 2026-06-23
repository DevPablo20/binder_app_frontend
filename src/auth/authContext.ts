import { createContext } from 'react';

import type { MeResponse } from '@/types/user';

export interface AuthContextValue {
  user: MeResponse | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  refetch: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
