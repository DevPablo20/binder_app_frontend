import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  Box,
  Container,
  CssBaseline,
  ThemeProvider,
  Typography,
} from '@mui/material';
import { theme } from '@/theme';

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
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Container maxWidth="md">
          <Box
            sx={{
              minHeight: '100vh',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              gap: 2,
              textAlign: 'center',
            }}
          >
            <Typography variant="h3" component="h1">
              {import.meta.env.VITE_APP_NAME}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Projeto configurado e pronto para as próximas fases (rotas, auth e
              telas).
            </Typography>
            <Typography variant="caption" color="text.secondary">
              API: {import.meta.env.VITE_API_URL}
            </Typography>
          </Box>
        </Container>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
