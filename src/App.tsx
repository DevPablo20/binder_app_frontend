import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CssBaseline } from '@mui/material';
import { RouterProvider } from 'react-router-dom';

import { AuthProvider } from '@/auth/AuthProvider';
import { router } from '@/routes';
import { ThemeModeProvider } from '@/theme/ThemeModeProvider';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeModeProvider>
        <CssBaseline />
        <AuthProvider>
          <RouterProvider router={router} />
        </AuthProvider>
      </ThemeModeProvider>
    </QueryClientProvider>
  );
}

export default App;
