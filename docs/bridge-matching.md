# Bridge — Vinculação

UI de operação que mapeia identidades do lake sobre metadados do Binder. Escrita é
Superadmin. Contratos de backend em `binder_app_backend/src/bridge/`.

Invariantes e consequências para a UI: [../CLAUDE.md](../CLAUDE.md).

## Rotas

| Rota | Componente | Mapeia |
|---|---|---|
| `/dashboard/bridge` | `BridgeHubPage` | cards de entrada dos fluxos |
| `/dashboard/bridge/accounts` | `AccountMatchingPage` | `PlatformAccount` |
| `/dashboard/bridge/campaigns` | `CampaignMatchingPage` | vínculo de campanha |
| `/dashboard/bridge/ad-groups` | `AdGroupMatchingPage` | classificação por eixos |
| `/dashboard/bridge/ads` | `AdMatchingPage` | tradução de formato |

Shell compartilhado: `BridgePageShell` + `BridgeFlowTabs` por rota.
Nav: seção **Vinculação** (`bridge`) em `../src/navigation/navConfig.ts`.

## Padrão de UX (o alvo para todos os fluxos)

1. **Filtro mínimo no topo** — plataforma, e só o que o fluxo realmente precisa. Alvos do
   Binder **não são filtros**.
2. **Duas tabelas com checkbox** — **Vinculados** e **Disponíveis (ETL)**.
3. **Selecionar linhas do ETL → Associar** abre o diálogo, que coleta os alvos e o
   enriquecimento **uma vez para o lote inteiro** e envia um único request bulk.
4. **Outras ações em lote** — Remover / Atualizar, com `BulkConfirmDialog`.
5. **Clique na linha alterna a seleção** — `CheckboxDataTable`; o checkbox continua
   funcionando.

O diálogo vale para a **seleção inteira**. Não degrade para uma linha por vez.

Contas e campanhas usam esse fluxo. Ad groups e ads são wrappers finos sobre o
`ObjectMatchingPage` legado, com alvos nos filtros do topo — porte para o fluxo de diálogo
antes de adicionar feature neles.

## Contas

Filtro: **plataforma**.

Uma conta de anúncio pode servir **vários clientes** — caso real de agência. A chave do
backend é `UNIQUE (platform, external_account_id, client)`, então a mesma conta rende uma
linha por cliente. Nunca assuma dono único.

- Disponíveis: `GET /bridge/catalog/:platformId?objectType=account&unmatchedOnly=true`
- Vinculados: `GET /bridge/platform-accounts?platformId=` — linhas trazem `clientName` e
  `platformName`; renderize nomes
- Associar: `AssociateAccountsDialog` escolhe um ou mais clientes →
  `POST /bridge/platform-accounts/bulk` `{ platformId, accounts[], clientIds[] }`, que grava
  o produto cartesiano contas × clientes
- Remover: `DELETE /bridge/platform-accounts` `{ ids }` — **cascateia todos os filhos**
- Trocar cliente: confirmar → `PATCH` com o novo `clientId` (o backend apaga os filhos antes)

## Campanhas

Filtro: **plataforma**.

É aqui que a campanha de negócio **nasce**. Todo ad_group e ad abaixo herda esse vínculo, e
por isso este fluxo é **pré-requisito dos outros dois**.

- Vinculados: linhas **agrupadas por id de campanha do ETL**, listando cada cliente pelo qual
  a campanha está ligada — consequência direta de contas compartilhadas
- Disponíveis: `GET /bridge/catalog/:platformId?objectType=campaign&unmatchedOnly=true`
- Associar: o diálogo coleta campanha do Binder + channel + buying type para o lote

**Buying type vem do plano de mídia**, não da plataforma. Não tente derivar de campo nativo,
e deixe claro no rótulo que é entrada manual.

**Fila de pendências:** campanhas do lake ainda não vinculadas precisam aparecer com destaque
("3 campanhas novas aguardando vínculo"). Sem isso, o gate que protege a integridade vira
bloqueio silencioso para quem tenta classificar ad groups.

## Ad groups

Filtro: **plataforma** e **cliente**.

É o único nível onde eixos são atribuídos. Aqui mora o trabalho real de configuração — na
ordem de centenas de decisões para o histórico de TikTok já ingerido.

- Só aparecem ad groups cuja campanha **já está vinculada**. Os demais vão para a fila de
  pendências do fluxo de campanhas, com o motivo explícito
- A campanha de negócio **não é escolhida aqui** — é derivada do vínculo. Não ofereça o campo
- O diálogo mostra **um seletor por eixo declarado na campanha**, cada um **single-select**.
  Nunca uma lista multi-select solta
- Eixo sem valor é legítimo: vira "Não informado" no relatório, não erro de formulário

## Ads — tradução de formato

Este fluxo **mudou de natureza**. Não é mais classificar ad a ad; é manter a tabela de
tradução `(plataforma, valor nativo) → (format, sub-format)` — poucas linhas por plataforma
(no TikTok: `SINGLE_VIDEO`, `CAROUSEL_ADS` e formato nulo), contra centenas de ads.

- Tela principal: a tabela de tradução da plataforma, editável
- **Fila de pendências**: valores nativos vistos no lake sem tradução, **ordenados por
  investimento afetado**. Alerta persistente e clicável: *"2 formatos não traduzidos afetando
  R$ 47k (12% do investimento)"*
- Exceção pontual: sobrescrever o formato de um ad específico. É exceção — não é o caminho
  principal e não deve dominar a tela

## Publicação

Editar não dispara processamento. A UI precisa deixar isso óbvio:

- Badge persistente: *"14 alterações não materializadas desde 08/09 14:32"*
- Botão **Publicar** — congela o snapshot que o ETL vai consumir
- Depois de publicar, o estado é *aguardando processamento*: o relatório só muda na próxima
  rodada. Diga isso, não deixe o usuário achar que quebrou

O objetivo é configurar tudo e publicar **uma vez**, não reprocessar a cada micro-alteração.

## Cobertura nos relatórios

Todo relatório mostra a cobertura do enriquecimento junto do número —
*"88% do investimento classificado"*. "Não informado" é categoria visível nos gráficos, nunca
filtro implícito.

Isso não é enfeite: é o que sustenta a confiança nos dados. Um número sem a medida de quanto
dele está classificado é um número em que não dá para confiar.

## Fora de escopo desta UI

- Seletor de eixo no nível de ad — herança é pura, não existe override
- Colunas de FK de pai nas telas — a hierarquia vive no lake
- Histórico de mapeamentos removidos — SCD tipo 1, sem versionamento de linha
