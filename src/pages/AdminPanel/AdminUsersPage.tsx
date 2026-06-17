import {
  Alert,
  Box,
  Chip,
  CircularProgress,
  Container,
  FormControlLabel,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';

import { ApiError } from '@/api/client';
import { getUsers } from '@/api/user';
import { ROLE_LABELS } from '@/auth/roles';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { UserCompaniesDrawer } from '@/pages/AdminPanel/UserCompaniesDrawer';
import type { UserWithCompanies } from '@/types/user';

export function AdminUsersPage() {
  const [includeInactiveUsers, setIncludeInactiveUsers] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const {
    data: users = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['users'],
    queryFn: getUsers,
  });

  const displayedUsers = includeInactiveUsers
    ? users
    : users.filter((user) => user.isActive);

  const selectedUser: UserWithCompanies | null =
    users.find((user) => user.id === selectedUserId) ?? null;

  const listError =
    error instanceof ApiError
      ? error.message
      : error
        ? 'Erro ao carregar usuários.'
        : null;

  return (
    <DashboardLayout>
      <Container
        maxWidth="lg"
        sx={{ py: { xs: 4, sm: 6 }, px: { xs: 2, sm: 4 } }}
      >
        <Stack spacing={3}>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            sx={{
              alignItems: { sm: 'center' },
              justifyContent: 'space-between',
            }}
          >
            <Typography variant="h4" component="h1">
              Usuários
            </Typography>

            <FormControlLabel
              control={
                <Switch
                  checked={includeInactiveUsers}
                  onChange={(event) =>
                    setIncludeInactiveUsers(event.target.checked)
                  }
                />
              }
              label="Incluir inativos"
            />
          </Stack>

          {listError && <Alert severity="error">{listError}</Alert>}

          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Nome</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Perfil</TableCell>
                    <TableCell>Ativo</TableCell>
                    <TableCell align="right">Empresas</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {displayedUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ py: 2 }}
                        >
                          Nenhum usuário encontrado.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    displayedUsers.map((user) => (
                      <TableRow
                        key={user.id}
                        hover
                        selected={selectedUserId === user.id}
                        onClick={() => setSelectedUserId(user.id)}
                        sx={{ cursor: 'pointer' }}
                      >
                        <TableCell>{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Chip
                            label={ROLE_LABELS[user.role]}
                            size="small"
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={user.isActive ? 'Sim' : 'Não'}
                            size="small"
                            color={user.isActive ? 'success' : 'default'}
                          />
                        </TableCell>
                        <TableCell align="right">
                          {user.companies.length}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Stack>
      </Container>

      <UserCompaniesDrawer
        user={selectedUser}
        open={selectedUserId !== null}
        onClose={() => setSelectedUserId(null)}
      />
    </DashboardLayout>
  );
}

