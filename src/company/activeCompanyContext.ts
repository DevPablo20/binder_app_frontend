import { createContext } from 'react';

import type { CompanySummary } from '@/types/user';

export interface ActiveCompanyContextValue {
  /** Reserved for future company switcher — null until a company is selected. */
  activeCompanyId: string | null;
  activeCompany: CompanySummary | null;
  companies: CompanySummary[];
}

export const ActiveCompanyContext =
  createContext<ActiveCompanyContextValue | null>(null);
