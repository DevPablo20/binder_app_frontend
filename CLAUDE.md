# binder_app_frontend

Painel administrativo Vite + React + MUI da plataforma Binder. Consome o `binder_app_backend`
(NestJS) em `VITE_API_URL`.

O trabalho central desta UI é a **Vinculação (Bridge)**: transformar identidades cruas do lake
em dados classificados com vocabulário de negócio. Escrita é Superadmin.

## Iniciativa ativa

`bridge-enrichment` — plano único dos três repositórios em
`binder_etl/docs/plans/bridge-enrichment.md` (repositório irmão): passos, próxima ação,
decisões em aberto e o que existe hoje × alvo nesta UI.

**As telas atuais falam com o `PlatformObjectMap` legado.** Não descreva uma tela ou fluxo
alvo como se já existisse. Contratos de API: leia `binder_app_backend/src/bridge/` — não
invente campo de DTO.

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

**Identificação e classificação.** A tabela acima tem dois tipos de linha. *Identificação* diz
a que entidade de negócio o objeto pertence — conta → cliente, campanha da plataforma →
campanha de negócio. É declarada uma vez e herdada por toda a hierarquia abaixo; nenhum nível
abaixo a digita. *Classificação* anexa atributos: channel, buying type, eixos, formato. O
vocabulário disponível para classificar um nível é limitado pelo escopo que a identificação de
cima estabeleceu — os eixos de um ad_group são os da campanha de negócio do binding dele, e
não outros. Por isso o nível de ad_group só classifica: a identificação ele herda.

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
- **Uma conta de anúncio pertence a exatamente um cliente.** A chave é
  `UNIQUE (platform, external_account_id)`. O fato do lake não carrega cliente: se a mesma
  conta rendesse uma linha por cliente, o join do enriquecimento duplicaria a métrica.
  Um cliente com **várias contas** é normal e suportado — o inverso não existe.
- **Filtro é navegação, não dado.** Usar a campanha para achar os objetos é correto; gravar
  o filtro na linha não. Abaixo do vínculo de campanha, a campanha de negócio é derivada — o
  `ObjectMatchingPage` legado grava o filtro do topo em `platform_object_map.campaign_id`, e é
  justamente isso que as telas novas não repetem.
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

## Onde cada informação mora (compartilhado)

| Tipo | Onde |
|---|---|
| Regra que vale sempre | `CLAUDE.md` |
| Como e por que funciona; desenho decidido | `docs/*.md` — no presente, sem data, sem número de passo, volumes em ordem de grandeza |
| O que falta, status, decisões em aberto, medições datadas | `docs/plans/<iniciativa>.md` |
| Ideia ainda sem escopo | `docs/plans/backlog.md` |

Iniciativa que envolve mais de um repositório tem um plano só, no repositório onde começou;
os outros apontam para ele.

Todo passo de uma iniciativa termina com: testes verdes → status e diário atualizados no
plano → regra nova sobe para o `CLAUDE.md` e mudança de desenho para `docs/` → rótulos
"alvo"/"legado" que ficaram falsos saem → a checagem abaixo volta vazia. Ao encerrar a
iniciativa, o plano é apagado e o ponteiro sai do `CLAUDE.md`.

```bash
grep -rnE "\bpasso [0-9]|\bfeito\b|[0-9]{2}/[0-9]{2}/20[0-9]{2}" CLAUDE.md docs .claude --exclude-dir=plans 2>/dev/null
```

> Este bloco é espelhado nos três repositórios. Ao mudar, mude nos três.
