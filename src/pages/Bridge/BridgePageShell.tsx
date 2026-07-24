import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { Box, Button, Container, Stack, Typography } from '@mui/material';
import type { ReactNode } from 'react';
import { Link as RouterLink } from 'react-router-dom';

import { DashboardLayout } from '@/components/layout/DashboardLayout';

interface BridgePageShellProps {
  title: string;
  description: string;
  children: ReactNode;
}

export function BridgePageShell({
  title,
  description,
  children,
}: BridgePageShellProps) {
  return (
    <DashboardLayout>
      <Container maxWidth="lg" sx={{ py: 3 }}>
        <Stack spacing={3}>
          <Box>
            <Button
              component={RouterLink}
              to="/dashboard/bridge"
              startIcon={<ArrowBackIcon />}
              size="small"
              sx={{ mb: 1, px: 0 }}
            >
              Voltar para vinculação
            </Button>
            <Typography variant="h4" component="h1" gutterBottom>
              {title}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {description}
            </Typography>
          </Box>
          {children}
        </Stack>
      </Container>
    </DashboardLayout>
  );
}
