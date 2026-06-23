import { useContext } from 'react';

import {
  ActiveCompanyContext,
  type ActiveCompanyContextValue,
} from '@/company/activeCompanyContext';

export function useActiveCompany(): ActiveCompanyContextValue {
  const context = useContext(ActiveCompanyContext);
  if (!context) {
    throw new Error(
      'useActiveCompany must be used within ActiveCompanyProvider',
    );
  }
  return context;
}
