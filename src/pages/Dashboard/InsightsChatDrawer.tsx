import AutoAwesomeOutlinedIcon from '@mui/icons-material/AutoAwesomeOutlined';
import CloseIcon from '@mui/icons-material/Close';
import SendIcon from '@mui/icons-material/Send';
import {
  Box,
  CircularProgress,
  Divider,
  Drawer,
  Fab,
  IconButton,
  TextField,
  Typography,
} from '@mui/material';
import { useMutation } from '@tanstack/react-query';
import { type FormEvent, useEffect, useRef, useState } from 'react';

import { postAnalyticsChat } from '@/api/analytics';
import type {
  AnalyticsChatMessage,
  AnalyticsMetricsQuery,
} from '@/types/analytics';
import { getErrorMessage } from '@/utils/errors';

interface InsightsChatDrawerProps {
  context: AnalyticsMetricsQuery;
}

export function InsightsChatDrawer({ context }: InsightsChatDrawerProps) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<AnalyticsChatMessage[]>([]);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const chatMutation = useMutation({
    mutationFn: postAnalyticsChat,
    onSuccess: (data) => {
      setMessages((prev) => [...prev, { role: 'model', content: data.reply }]);
    },
  });

  useEffect(() => {
    if (!open) return;
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open, chatMutation.isPending]);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const message = input.trim();
    if (!message || chatMutation.isPending) return;

    const history = messages.slice(-16);
    setMessages((prev) => [...prev, { role: 'user', content: message }]);
    setInput('');
    chatMutation.mutate({ message, history, context });
  }

  const errorMessage = chatMutation.isError
    ? getErrorMessage(chatMutation.error, 'Falha ao consultar insights')
    : null;

  return (
    <>
      <Fab
        color="primary"
        aria-label="Abrir chat de insights"
        onClick={() => setOpen(true)}
        sx={{
          position: 'fixed',
          right: { xs: 16, sm: 24 },
          bottom: { xs: 16, sm: 24 },
          zIndex: (theme) => theme.zIndex.drawer - 1,
        }}
      >
        <AutoAwesomeOutlinedIcon />
      </Fab>

      <Drawer
        anchor="right"
        open={open}
        onClose={() => setOpen(false)}
        slotProps={{
          paper: {
            sx: {
              width: { xs: '100%', sm: 400 },
              display: 'flex',
              flexDirection: 'column',
            },
          },
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            px: 2,
            py: 1.5,
          }}
        >
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              Insights
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Pergunte sobre as métricas do dashboard
            </Typography>
          </Box>
          <IconButton
            aria-label="Fechar chat"
            onClick={() => setOpen(false)}
            edge="end"
          >
            <CloseIcon />
          </IconButton>
        </Box>

        <Divider />

        <Box
          sx={{
            flex: 1,
            overflow: 'auto',
            px: 2,
            py: 2,
            bgcolor: 'background.default',
            display: 'flex',
            flexDirection: 'column',
            gap: 1.5,
          }}
        >
          {messages.length === 0 && !chatMutation.isPending && (
            <Typography variant="body2" color="text.secondary">
              Ex.: “Quanto investimos no período?” ou “Qual canal tem melhor
              CTR?”. Os filtros atuais do dashboard são usados como contexto.
            </Typography>
          )}

          {messages.map((msg, index) => (
            <Box
              key={`${msg.role}-${index}`}
              sx={{
                alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '90%',
                px: 1.5,
                py: 1,
                borderRadius: 2,
                bgcolor:
                  msg.role === 'user' ? 'primary.main' : 'background.paper',
                color:
                  msg.role === 'user'
                    ? 'primary.contrastText'
                    : 'text.primary',
                border: msg.role === 'model' ? 1 : 0,
                borderColor: 'divider',
                whiteSpace: 'pre-wrap',
              }}
            >
              <Typography variant="body2">{msg.content}</Typography>
            </Box>
          ))}

          {chatMutation.isPending && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CircularProgress size={16} />
              <Typography variant="caption" color="text.secondary">
                Consultando métricas…
              </Typography>
            </Box>
          )}

          {errorMessage && (
            <Typography variant="body2" color="error">
              {errorMessage}
            </Typography>
          )}
          <div ref={bottomRef} />
        </Box>

        <Divider />

        <Box
          component="form"
          onSubmit={handleSubmit}
          sx={{ p: 2, display: 'flex', gap: 1 }}
        >
          <TextField
            size="small"
            fullWidth
            placeholder="Pergunte sobre os dados…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={chatMutation.isPending}
            autoComplete="off"
          />
          <IconButton
            type="submit"
            color="primary"
            aria-label="Enviar"
            disabled={!input.trim() || chatMutation.isPending}
          >
            <SendIcon />
          </IconButton>
        </Box>
      </Drawer>
    </>
  );
}
