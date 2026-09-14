# Estrutura do projeto

Painel Vite + React + MUI. Consome `binder_app_backend` em `VITE_API_URL`.
Invariantes: [../CLAUDE.md](../CLAUDE.md). UX de vinculação:
[bridge-matching.md](bridge-matching.md).

## Raiz

```
binder_app_frontend/
├── CLAUDE.md               # contexto sempre carregado
├── docs/                   # referência sob demanda
├── src/                    # código (editar aqui)
├── dist/                   # build — não editar
├── public/
├── compose.yaml
├── Dockerfile
├── nginx.conf
├── index.html
├── vite.config.ts
└── .env.example
```

## Entrypoints

| Arquivo | Papel |
|---|---|
| `index.html` | shell HTML; monta `#root`; carrega `src/main.tsx` |
| `src/main.tsx` | raiz React |
| `src/App.tsx` | providers + `RouterProvider` |
| `src/routes/index.tsx` | árvore de rotas via `createBrowserRouter` |

## Árvore de `src/`

```
src/
├── api/                    # módulos apiFetch por domínio (credentials: include)
│   ├── client.ts
│   ├── bridge-catalog.ts
│   ├── platform-account.ts
│   ├── platform-object-map.ts        # LEGADO — substituído pelos endpoints do modelo alvo
│   └── client-api.ts, campaign.ts, platform.ts, channel.ts, grouping.ts, …
├── auth/                   # AuthProvider, roles, useAuth
├── company/                # ActiveCompanyProvider
├── navigation/navConfig.ts # seções: workspace | catalog | bridge | admin
├── routes/
│   ├── index.tsx
│   ├── GuestRoute.tsx
│   ├── RequireRole.tsx
│   └── RequireMinRole.tsx
├── pages/
│   ├── Bridge/             # Vinculação (Superadmin)
│   │   ├── BridgeHubPage.tsx
│   │   ├── BridgeFlowTabs.tsx
│   │   ├── BridgePageShell.tsx
│   │   ├── AccountMatchingPage.tsx
│   │   ├── CampaignMatchingPage.tsx   # fluxo de diálogo
│   │   ├── AdGroupMatchingPage.tsx    # wrapper → ObjectMatchingPage
│   │   ├── AdMatchingPage.tsx         # wrapper → ObjectMatchingPage
│   │   ├── ObjectMatchingPage.tsx     # LEGADO (ad_group, ad)
│   │   ├── catalogHelpers.ts
│   │   └── components/     # CheckboxDataTable, BulkConfirmDialog,
│   │                       # AssociateAccountsDialog, AssociateCampaignsDialog
│   ├── Catalog/            # Platforms, Channels, BuyingTypes
│   ├── Clients/
│   ├── Groupings/          # drawers abertos a partir de Clients
│   ├── AdminPanel/  Invites/  Dashboard/  Login/  Home/  Password*/
├── components/layout/      # DashboardLayout, AppSidebar, …
├── types/                  # espelhos de DTO (bridge.ts, …)
├── theme/                  # tema Binder — ver mui-theme.md
└── utils/
```

## Provider stack

`QueryClientProvider` → `ThemeModeProvider` → `ThemeProvider` → `CssBaseline` →
`AuthProvider` → `ActiveCompanyProvider` → `RouterProvider`

## Variáveis de ambiente

| Variável | Uso | Exemplo |
|---|---|---|
| `VITE_API_URL` | base do backend | `http://localhost:8090` |
| `VITE_APP_NAME` | nome exibido | `Binder App` |
| `VITE_DEV_PORT` | porta do Vite | `3000` |

## Integração com o backend

Irmão: `../binder_app_backend/`

| Assunto | Detalhe |
|---|---|
| Auth | JWT em cookie `httpOnly` `access_token` |
| Fetch | `credentials: 'include'` via `apiFetch` |
| Roles | `superadmin`, `editor`, `viewer` |
| API Bridge hoje | `/bridge/catalog/:platformId`, `/bridge/platform-accounts`, `/bridge/platform-object-maps` (com `POST /bulk`, `PATCH` e `DELETE` em lote) |

Confirme contratos em `binder_app_backend/src/bridge/` — **não invente campo de DTO.**

## Convenções

- **Imports**: alias `@/`
- **Páginas**: `src/pages/<Feature>/`; vinculação em `pages/Bridge/`
- **API**: um módulo por recurso em `src/api/`; tipos em `src/types/`
- **UI**: MUI + RHF + Zod + TanStack Query — espelhe os padrões de Catalog e Clients
- **Não editar**: `dist/`, `node_modules/`
- **Não criar código de backend** a partir deste repo

## Checklist anti-alucinação

1. Verifique que o arquivo existe em `src/` antes de citá-lo — o app passou da fase de
   scaffold.
2. A UI de vinculação **existe** (`pages/Bridge/`, APIs de bridge, seção `bridge` no nav).
3. Para comportamento de vinculação, siga [bridge-matching.md](bridge-matching.md).
4. As telas de **publicação**, **fila de pendências de tradução** e **card de cobertura**
   ainda **não existem** — são alvo.
5. `platform-object-map.ts` e `ObjectMatchingPage` são legado. Não construa feature nova
   sobre eles, e não os remova fora do plano da iniciativa ativa.
