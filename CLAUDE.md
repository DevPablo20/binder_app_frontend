# binder_app_frontend

Painel administrativo Vite + React + MUI da plataforma Binder. Consome o `binder_app_backend`
(NestJS) em `VITE_API_URL`.

O trabalho central desta UI é a **Vinculação (Bridge)**: transformar identidades cruas do lake
em dados classificados com vocabulário de negócio. Escrita é Superadmin.

## Estado desta branch

`arch/bridge-enrichment` reorganiza a documentação para a arquitetura decidida. **O código
ainda é o antigo** — as telas atuais falam com `PlatformObjectMap`, que vai ser substituído.

O que muda, no passo 9 do plano (depois que o backend entregar os passos 4–7):

| Fluxo | Hoje | Alvo |
|---|---|---|
| Contas | mapeia conta → cliente | **sem mudança** |
| Campanhas | `PlatformObjectMap` `campaign` + channel + buying type | `platform_campaign_binding` — mesma UX, endpoint novo |
| Ad groups | `ObjectMatchingPage` legado, alvos nos filtros do topo | tela própria no fluxo de diálogo, com um seletor **single-select por eixo** |
| Ads | classificar formato ad a ad (adiado, sem UI) | **muda de natureza**: manter poucas traduções por plataforma (3 no TikTok hoje), mais exceção pontual |
| Publicação | não existe | alerta de alterações não materializadas + botão Publicar |
| Cobertura | não existe | card de "% do investimento classificado" nos relatórios |

Não descreva o alvo como se já existisse. Contratos de API: leia
`binder_app_backend/src/bridge/` — não invente campo de DTO.

## Arquitetura de enriquecimento (invariantes compartilhadas)

Valem nos três repositórios. Contradizer uma delas é bug, não escolha de implementação.

1. **Um fato: ad × dia.** `campaign`, `ad_group` e `ad` são níveis de *declaração*, não grãos
   de dado. Tudo resolve até a linha ad × dia.
2. **Um atributo, um nível.** Cada atributo é declarado em exatamente um nível e propaga para
   baixo. Sem override, sem declaração dupla.
3. **O nível é do negócio, não da plataforma.**
4. **A amarração é do banco.** A UI não reimplementa integridade — respeita o erro do backend.
5. **Nada some por enriquecimento.** Ausência de classificação vira "Não informado", categoria
   visível nos gráficos — nunca linha filtrada em silêncio.
6. **SCD tipo 1.** Corrigir uma classificação reescreve o histórico. A UI deve deixar isso
   explícito para quem edita.

| Atributo | Declarado em | Propaga para | Origem |
|---|---|---|---|
| Cliente | account | tudo abaixo | configuração |
| Campanha de negócio | campaign | ad_group, ad | configuração |
| Channel | campaign | ad_group, ad | configuração manual |
| Buying type | campaign | ad_group, ad | plano de mídia |
| Território, Persona, … | ad_group | ad | configuração |
| Format / Sub-format | ad | — | traduzido do nativo |

> Este bloco é espelhado em `binder_app_backend/CLAUDE.md` e `binder_etl/CLAUDE.md`.
> Ao mudar, mude nos três.

## Consequências diretas para a UI

- **Ad não recebe eixo.** Território e Persona são atribuídos no ad_group; o ad herda. Não
  existe seletor de eixo na tela de ads, e não existe override.
- **Um valor por eixo.** O seletor de sub-agrupamento é **single-select por eixo**, não uma
  lista multi-select solta como hoje.
- **A campanha de negócio não é digitada** em ad_group nem em ad — é derivada do vínculo de
  campanha. Se a campanha da plataforma não foi vinculada ainda, o ad_group é
  *inclassificável*. Isso precisa aparecer como **fila de pendências** ("3 campanhas novas
  aguardando vínculo"), senão vira bloqueio silencioso.
- **Configurar não publica.** As edições ficam pendentes até alguém clicar em Publicar; o
  relatório só reflete depois da próxima rodada do ETL.
- **O número nunca aparece sozinho.** Todo relatório mostra a cobertura do enriquecimento ao
  lado do valor. É isso que sustenta a confiança nos dados, mais do que validação de
  formulário.

## Regras duras

- **Renderize nomes, nunca UUID.** As respostas de resumo trazem `accountName`,
  `platformName`, `clientName`, `campaignName`, `channelName`, `buyingTypeName` justamente
  para isso.
- **Ações em lote são em lote.** O diálogo de associação coleta os alvos uma vez e envia um
  único request bulk. Não degrade para uma linha por vez, e não use `POST` paralelos — deixam
  estado parcial quando um item falha.
- **Uma conta de anúncio pode servir vários clientes** (caso real de agência). A chave é
  `UNIQUE (platform, external_account_id, client)` — nunca assuma dono único.
- **Não contorne regra de nível na UI.** Se o backend recusa, a tela está errada.
- **Não criar código de backend a partir deste repo.**
- Não editar: `dist/`, `node_modules/`.

## Comandos

```bash
npm run dev          # Vite dev server
npm run build        # build de produção
npm run lint
docker compose up
```

## Documentação

| Arquivo | Quando ler |
|---|---|
| [docs/bridge-matching.md](docs/bridge-matching.md) | UX de vinculação, rotas, fluxos por nível |
| [docs/project-structure.md](docs/project-structure.md) | árvore de diretórios, providers, rotas |
| [docs/mui-theme.md](docs/mui-theme.md) | tema Binder, tokens, componentes |
| [docs/tech-stack.md](docs/tech-stack.md) | versões e práticas por biblioteca |
