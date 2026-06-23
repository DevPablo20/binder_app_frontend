import type { ReactNode } from 'react';

import { useAuth } from '@/auth/useAuth';
import { ActiveCompanyContext } from '@/company/activeCompanyContext';

interface ActiveCompanyProviderProps {
  children: ReactNode;
}

/**
 * Placeholder for future company switcher.
 * Exposes user companies and reserves activeCompanyId for when selection is implemented.
 */
export function ActiveCompanyProvider({
  children,
}: ActiveCompanyProviderProps) {
  const { user } = useAuth();
  const companies = user?.companies ?? [];

  const value = {
    activeCompanyId: null as string | null,
    activeCompany: null,
    companies,
  };

  return (
    <ActiveCompanyContext.Provider value={value}>
      {children}
    </ActiveCompanyContext.Provider>
  );
}
