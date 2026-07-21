import { Box, Container, Stack, Typography } from '@mui/material';
import type { ReactNode } from 'react';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { BridgeTabs } from '@/pages/Bridge/BridgeTabs';

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
            <Typography variant="h4" component="h1" gutterBottom>
              {title}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {description}
            </Typography>
          </Box>
          <BridgeTabs />
          {children}
        </Stack>
      </Container>
    </DashboardLayout>
  );
}
