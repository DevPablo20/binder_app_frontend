import CloseIcon from '@mui/icons-material/Close';
import {
  Box,
  Chip,
  CircularProgress,
  Divider,
  Drawer,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { getChannels } from '@/api/channel';
import type { PlatformSummary } from '@/types/platform';

interface PlatformChannelsDrawerProps {
  platform: PlatformSummary | null;
  open: boolean;
  onClose: () => void;
}

export function PlatformChannelsDrawer({
  platform,
  open,
  onClose,
}: PlatformChannelsDrawerProps) {
  const { data: channels = [], isLoading } = useQuery({
    queryKey: ['channels'],
    queryFn: getChannels,
    enabled: open,
  });

  const platformChannels = useMemo(
    () =>
      platform
        ? channels.filter((channel) => channel.platformId === platform.id)
        : [],
    [channels, platform],
  );

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      slotProps={{ paper: { sx: { width: { xs: '100%', sm: 380 } } } }}
    >
      {platform && (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              p: 2.5,
            }}
          >
            <Box>
              <Typography variant="h6">{platform.name}</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Canais vinculados
              </Typography>
            </Box>
            <IconButton onClick={onClose} aria-label="Fechar">
              <CloseIcon />
            </IconButton>
          </Box>
          <Divider />
          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer sx={{ flex: 1 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Nome</TableCell>
                    <TableCell>Ativo</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {platformChannels.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={2} align="center">
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ py: 2 }}
                        >
                          Nenhum canal vinculado.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    platformChannels.map((channel) => (
                      <TableRow key={channel.id}>
                        <TableCell>{channel.name}</TableCell>
                        <TableCell>
                          <Chip
                            label={channel.isActive ? 'Sim' : 'Não'}
                            size="small"
                            color={channel.isActive ? 'success' : 'default'}
                          />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>
      )}
    </Drawer>
  );
}
