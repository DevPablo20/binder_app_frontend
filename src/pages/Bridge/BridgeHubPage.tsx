import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  Container,
  Stack,
  Typography,
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

import { DashboardLayout } from '@/components/layout/DashboardLayout';

const BRIDGE_CARDS = [
  {
    title: 'Contas',
    description:
      'Associe contas ETL ao cliente e plataforma, ou revise vínculos existentes.',
    path: '/dashboard/bridge/accounts',
  },
  {
    title: 'Campanhas',
    description:
      'Vincule campanhas ETL a uma campanha Binder com canal e tipo de compra.',
    path: '/dashboard/bridge/campaigns',
  },
  {
    title: 'Grupos de anúncios',
    description:
      'Associe grupos de anúncios ETL cujas campanhas já estão vinculadas à campanha Binder.',
    path: '/dashboard/bridge/ad-groups',
  },
  {
    title: 'Anúncios',
    description:
      'Associe anúncios ETL cujos ad groups já estão vinculados à campanha Binder.',
    path: '/dashboard/bridge/ads',
  },
] as const;

export function BridgeHubPage() {
  return (
    <DashboardLayout>
      <Container maxWidth="lg" sx={{ py: 3 }}>
        <Stack spacing={3}>
          <Box>
            <Typography variant="h4" component="h1" gutterBottom>
              Vinculação
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Escolha o tipo de entidade para visualizar vínculos existentes ou
              criar novas associações com o pool ETL.
            </Typography>
          </Box>

          <Box
            sx={{
              display: 'grid',
              gap: 2,
              gridTemplateColumns: {
                xs: '1fr',
                sm: '1fr 1fr',
              },
            }}
          >
            {BRIDGE_CARDS.map((card) => (
              <Card key={card.path} variant="outlined">
                <CardActionArea
                  component={RouterLink}
                  to={card.path}
                  sx={{ height: '100%', alignItems: 'stretch' }}
                >
                  <CardContent>
                    <Typography variant="h6" component="h2" gutterBottom>
                      {card.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {card.description}
                    </Typography>
                  </CardContent>
                </CardActionArea>
              </Card>
            ))}
          </Box>
        </Stack>
      </Container>
    </DashboardLayout>
  );
}
