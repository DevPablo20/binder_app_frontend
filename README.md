# binder_app_frontend

Frontend da Plataforma Binder — painel administrativo multi-empresa consumindo a API NestJS do `binder_app_backend`.

## Stack

- Vite + React + TypeScript
- Material UI (MUI)
- TanStack Query
- React Router (instalado, rotas na fase 2)
- react-hook-form + zod (formulários na fase 3)

## Pré-requisitos

- Node.js 20 **ou** Docker

## Variáveis de ambiente

Copie `.env.example` para `.env.development`:

```env
VITE_API_URL=http://localhost:8090
VITE_APP_NAME=Binder App
VITE_DEV_PORT=3000
```

| Variável | Descrição |
|----------|-----------|
| `VITE_API_URL` | URL base da API NestJS (chamadas feitas pelo navegador) |
| `VITE_APP_NAME` | Nome exibido na aplicação |
| `VITE_DEV_PORT` | Porta do servidor de desenvolvimento Vite |

O backend usa `FRONTEND_HOST=http://localhost:3000` no próprio `.env.development` para CORS e links de email.

## Desenvolvimento

### Opção 1 — Docker (recomendado)

```bash
# Terminal 1 — backend
cd ../binder_app_backend && docker compose up

# Terminal 2 — frontend
docker compose up
```

Acesso:

- Frontend: http://localhost:3000
- API: http://localhost:8090
- Swagger: http://localhost:8090/api

### Opção 2 — Local

```bash
npm install
npm run dev
```

## Scripts

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Servidor de desenvolvimento (porta 3000) |
| `npm run build` | Build de produção em `dist/` |
| `npm run preview` | Preview do build local |
| `npm run lint` | ESLint + Prettier |

## Build de produção (Docker)

```bash
docker build \
  --build-arg VITE_API_URL=https://api.exemplo.com \
  --build-arg VITE_APP_NAME="Binder App" \
  -t binder_app_frontend .
```

A imagem final usa nginx para servir os arquivos estáticos com fallback SPA.

## Estrutura do projeto

```
src/
├── api/          # Cliente HTTP (fase 2)
├── auth/         # Sessão e guards (fase 2)
├── components/   # UI reutilizável (fase 3)
├── hooks/        # Hooks compartilhados (fase 3)
├── pages/        # Telas (fase 3)
├── routes/       # Rotas (fase 2)
├── theme/        # Tema MUI
└── types/        # Tipos compartilhados (fase 2)
```

## Próximas fases

1. **Infra de API e auth** — cliente `fetch` com `credentials`, contexto de sessão (`/user/me`), rotas protegidas
2. **Telas core** — login, dashboard, empresas, usuários, convites
3. **Fluxos públicos** — aceitar/recusar convite, reset de senha

## Integração com o backend

- Autenticação via cookie `httpOnly` (`access_token`)
- Todas as chamadas autenticadas devem usar `credentials: 'include'`
- CORS configurado no backend para `FRONTEND_HOST`
