import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Box, Container, CssBaseline, Typography } from '@mui/material';

import { ThemeModeProvider } from '@/theme/ThemeModeProvider';
import { ThemeModeToggle } from '@/theme/ThemeModeToggle';

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
        <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'flex-end',
              p: 2,
            }}
          >
            <ThemeModeToggle />
          </Box>
          <Container maxWidth="md">
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
                py: 4,
                textAlign: 'left',
              }}
            >
              <Typography variant="h3" component="h1">
                {import.meta.env.VITE_APP_NAME}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Projeto configurado e pronto para as próximas fases (rotas, auth
                e telas).
              </Typography>
              <Typography variant="caption" color="text.secondary">
                API: {import.meta.env.VITE_API_URL}
              </Typography>
            </Box>
          </Container>
        </Box>
      </ThemeModeProvider>
    </QueryClientProvider>
  );
}

export default App;
