# CRM Legislativo — Estado atual (handoff)

> **AO RETOMAR, LEIA ESTE ARQUIVO PRIMEIRO.** Handoff completo pra continuar em outro
> terminal/sessão. Abra o Claude em `D:\portal legislativo\crm`.
> Última atualização: 2026-06-26 (madrugada). Fase 0 (Fundação) e Fase 1 (CRM núcleo) **completas**.
> Sessão da noite entregou: conector SAPL (congelado), Captura voz/foto (Whisper+Visão),
> Agente Investigador (IA agêntica), seam de envio + WhatsApp/Zernio, fix do bug de impressão
> (sidebar saía no PDF — ver §8), e levantamento competitivo
> (`docs/analise-competitiva.md` + `docs/paridade-vs-diferenciais.md` = checklist do edital de
> Ijuí/Città × nosso estado: paridade ✅7 🟡5 ⬜3 + camada de diferenciais que ninguém tem).
> Detalhes em §12.7 e nos PoCs `poc:sapl|captura|envio`.

## 1. O que é

CRM / **Plataforma de Inteligência Política** — produto SaaS **à parte** do portal público
da câmara. Multi-tenant: **Câmara → Gabinete**, dados do CRM **isolados por gabinete**.
Município-alvo de validação: **Taquari/RS**.

- Arquitetura do produto: `docs/Arquitetura-CRM-Radar-IA.md`
- Premissas técnicas validadas: `docs/00-premissas-crm.md`
- Política de processo (quando usar GSD): `../cms/docs/politica-gsd.md`
- Inteligência de produto: `docs/Inteligencia-Produto-CRM.md`

## 2. Estrutura de pastas (pasta-mãe)

```
D:\portal legislativo\        ← pasta-mãe (raiz)
├── .claude\   CLAUDE.md       (config do site; ver pendência §11)
├── cms\        → site público da câmara (Next+Payload+SAPL) — porta 3003
└── crm\        → ESTE projeto (CRM) — porta 3100
```

## 3. Stack

Next.js 15 (App Router) + React 19 + TypeScript · Prisma 6 + **PostgreSQL com pgvector** ·
Auth.js v5 (Credentials, JWT) · **BullMQ + Redis** · Tailwind v4 · Leaflet+OpenStreetMap (mapa).
pnpm. Node 25.

## 4. Como rodar (do zero)

```bash
cd "D:\portal legislativo\crm"
pnpm install                 # se node_modules não existir / após mover pasta (NUNCA mover node_modules do pnpm)
pnpm db:up                   # Postgres(pgvector) :5434 + Redis :6380 (docker)
pnpm db:push                 # cria/atualiza tabelas + gera Prisma Client
pnpm db:seed                 # dados demo (IDs FIXOS — ver §8)
# dois processos:
pnpm dev                     # app  → http://localhost:3100
pnpm worker                  # worker BullMQ (crons: cutuca 08:00, aniversário 07:00)
```

**Login demo:** `vereador.a@taquari.rs` / `demo1234` (Gabinete A). Também `teste@taquari.rs`/`senha123`.
**Criar usuário:** `pnpm user:criar <email> <senha> "<nome>" [gabineteId]`.

Portas (registro em `../PORTAS.md`): cms 3003 · crm web 3100 · Postgres 5434 · Redis 6380.

## 5. Isolamento multi-tenant (o coração — não quebrar)

- `src/lib/tenant-context.ts` — `AsyncLocalStorage` ancorado em **globalThis** (senão o bundler
  do Next duplica o módulo e o isolamento quebra silenciosamente). Helpers: `runComTenant`,
  `getTenant`, `requireTenant`, `comTenantDoJob` (jobs).
- `src/lib/prisma.ts` — Prisma Extension que injeta o filtro/atribuição por **escopo do modelo**:
  - escopo **gabinete**: Cidadao, Demanda, MovimentacaoDemanda, ComunicacaoEnviada, Alerta, DocumentoGabinete
  - escopo **camara**: UnidadeTerritorial, ResultadoEleitoral, Embedding
- `src/lib/with-tenant.ts` — `withTenant(session.tenant, fn)`: ponte sessão→contexto.
  **Faz `await fn()` DENTRO do `run`** porque as promises do Prisma são lazy — o await tem
  que acontecer dentro do contexto (lição dos PoCs).
- Páginas/actions **nunca** chamam `prisma` direto sem `withTenant`. Jobs sem tenant (cutuca,
  aniversário) rodam em **contexto admin** de propósito (varrem todos os gabinetes).
- **Raw queries ($queryRaw) NÃO passam pela extensão** — filtrar manualmente.

## 6. O que está construído

### Fase 0 — Fundação ✅
Tenancy (Camara/Gabinete/Usuario), isolamento (acima), Auth.js v5 (`src/auth.ts` + núcleo
testável `src/modules/auth/auth-core.ts`), pgvector, schema geo, fila BullMQ.

### Fase 1 — CRM núcleo ✅ (tudo isolado, cada feature com PoC)
- **Cidadãos/lideranças + tags** — CRUD. `tipoContato` (CIDADAO/LIDERANCA), campos de
  liderança, `tags String[]` (vocabulário por reúso via `TagInput`), `nascimento`, `ultimoContato`.
- **Demandas** — CRUD, ciclo de status com **histórico** (`MovimentacaoDemanda`, transação),
  **mapa** (lat/lng, Leaflet, picker por clique em `/dashboard/demandas/[id]`).
- **Termômetro de relacionamento** — `src/modules/crm/relacionamento.ts` (quente ≤30d /
  esfriando 31-90 / frio >90 ou nunca). Badge + "Registrar contato". Widget no dashboard.
- **Prova de trabalho** — ao resolver demanda com cidadão → cria `ComunicacaoEnviada` +
  **enfileira**; worker "entrega" (marca `enviadaEm`). Página `/dashboard/comunicacoes`.
- **Fila (BullMQ)** — `src/lib/queue.ts` (filas `comunicacoes` e `manutencao`), worker
  `src/worker.ts`, processadores testáveis `*.worker-core.ts`.
- **Cutuca** (cron diário 08:00) — alerta de contatos que esfriaram. `Alerta` model.
- **Aniversários** (cron diário 07:00) — alerta dos aniversariantes do dia (dedup/ano).
- **Disparo segmentado** — `/dashboard/disparo`: filtra por tag/bairro, dispara comunicação
  pra todos (enfileira).
- **WhatsApp** — `src/lib/whatsapp.ts` (link wa.me) na lista de cidadãos.
- **Documentos + mala direta** — `/dashboard/documentos`: avulso + mala direta (`{nome}`),
  view de impressão `/dashboard/documentos/[id]` (Ctrl+P → PDF, sem lib).
- **Dashboard** — visão geral: cards, alertas, termômetro, demandas recentes. Nav lateral
  (`DashboardNav`), layout protegido (`src/app/dashboard/layout.tsx`).

### Organização do código
`src/app/(rotas finas)` · `src/modules/<dominio>/*.queries.ts|*.actions.ts|*.worker-core.ts`
(domínios: `auth`, `crm`) · `src/lib` (prisma, tenant-context, with-tenant, queue, whatsapp) ·
`src/components`.

## 7. Scripts (package.json)

Dev: `dev` (3100) · `worker` · `build` · `start` · `typecheck` · `db:up/down/push/generate/seed`.
Operação: `user:criar` · `cutuca` (roda agora) · `aniversarios` (roda agora).
PoCs (testes isolados, **limpam/recriam dados** — rode `pnpm db:seed` depois):
`poc:isolamento`, `poc:auth`, `poc:demanda`, `poc:prova`, `poc:fila`, `poc:cutuca`,
`poc:aniversario`, `poc:disparo`, `poc:documentos`, `poc:termometro`, `poc:radar`, `poc:radar-bairro`, `poc:radar-disputa`,
`poc:ia`, `poc:vigia`, `poc:sapl` (live), `poc:captura` (live, TTS→Whisper + foto→Visão), `poc:envio` (seam, sem rede).
Operação IA/conectores: `ia:indexar`, `radar:importar`, `radar:agregar`.

## 8. Decisões travadas

- **IDs fixos no seed**: `camara-taquari`, `gab-a`, `gab-b` — re-semear não invalida sessões.
- **Tags = String[]** (não N:N) — isola sozinho, vocabulário por reúso. Promover a entidade só se precisar cor/rename.
- **Mapa = Leaflet/OSM** (sem chave). Unidade territorial do Radar = **bairro** (TSE não dá
  polígono de seção; usa-se endereço do local de votação + malha de bairros IBGE).
- **PDF = view de impressão do navegador** (sem lib). ⚠️ BUG CORRIGIDO (2026-06-26): a impressão
  saía com o app inteiro (sidebar escura colada no ofício/relatório). Faltava `print:hidden` na
  `<aside>` do `dashboard/layout.tsx` + CSS `@media print`/`@page` no globals.css (não existia
  NENHUM CSS de print no projeto). Corrigido: `print:hidden` na aside, `print:overflow-visible` no
  main, e bloco `@media print { @page{size:A4;margin:1.8cm} body{branco} article{sem borda/sombra/
  padding} }`. **ARMADILHA**: a 1ª tentativa "não funcionou" porque o `pnpm dev` rodava desde 20:25
  (antes do fix) e o navegador cacheou o CSS velho → SEMPRE reiniciar dev após mexer em globals.css
  E dar Ctrl+Shift+R. Verificado que o CSS servido tem @page/1.8cm/@media print. Aguardava
  confirmação visual do usuário na última interação.
- **Envio real**: seam plugável em `modules/comunicacao/` (WhatsApp/Zernio implementado, os 2 modos).
  Canal REGISTRO/EMAIL/SMS ainda no-op; WHATSAPP entrega quando configurado (env ZERNIO_*).
  Falta confirmar o endpoint 1:1 da Zernio no painel e testar com número real.

## 9. Premissas (de `docs/00-premissas-crm.md`)
1. TSE por seção — ✅ confirmado (CSV real baixado: `spike-crm/amostras/tse-secao-taquari-vereador-2024.csv`, 3.030 linhas).
2. Geometria — ✅ mitigado: Radar por **bairro** (IBGE `RS_bairros_CD2022.zip`).
3. Multi-tenant — ✅ provado (PoC + via HTTP real).
4. IA com fonte — ⬜ pendente (Fase 3).

## 10. Armadilhas conhecidas (já mordemos)
- **Após mudar schema** (`db push`): reinicie `pnpm dev` E `pnpm worker` — hot-reload não
  recarrega o Prisma Client.
- **Nunca mover `node_modules` do pnpm** (quebra symlinks) — apagar e `pnpm install`.
- **Docker Desktop** instável nesta máquina (backend WSL no F:); se cair, reabra e `pnpm db:up`.
- **Sessão stale**: se der FK em `camaraId` ao criar, é login antigo — Sair/entrar (IDs fixos já mitigam).
- **PoCs limpam o banco** — rode `pnpm db:seed` depois (cleanup do seed já cobre tabelas eleitorais).

## 11. Pendências da reorganização (do site/cms — fazer fora do Claude)
```powershell
Move-Item 'D:\portal legislativo\CLAUDE.md' 'D:\portal legislativo\cms\CLAUDE.md'
Move-Item 'D:\portal legislativo\.claude'   'D:\portal legislativo\cms\.claude'
cd 'D:\portal legislativo\cms'; pnpm install   # node_modules do site foi apagado no move
```
(Não afeta o CRM — só o site.)

## 12.7. Fase 3 — IA (fundação híbrida) ✅ início

Decisão: **híbrido** (local p/ embeddings/extração — privado/LGPD; fronteira p/ tarefas difíceis).
Construído (agnóstico, testável offline com provider **stub**):
- `src/modules/ia/config.ts` — tudo por env (IA_EMBED_PROVIDER / IA_GEN_LOCAL / IA_GEN_FRONTIER,
  Ollama URL+modelos, fronteira URL+key+model). DIM=1536 (coluna pgvector).
- `providers.ts` — stub (determinístico) · ollama (local, /api) · openai-compatible (fronteira).
- `gateway.ts` — `embed()` + `gerar({tier})` roteando local/fronteira.
- `indexar.ts` — indexa demandas do gabinete em `Embedding` (RAW SQL; `vetor` é Unsupported).
- `busca.ts` — busca semântica pgvector (`<=>`) com **isolamento manual**:
  `camaraId=X AND (gabineteId=Y OR gabineteId IS NULL)` — gabinete vê só o seu + compartilhados.
- **Schema**: `Embedding.gabineteId String?` (null=câmara/compartilhado; preenchido=privado). db push feito.
- PoC `pnpm poc:ia` (4/4): A1 vê suas demandas+compartilhado; A2 (mesmo câmara) NÃO vê A1; câmara B vê 0.
- Operacional: `pnpm ia:indexar [gabId]` (gab-a: 8 demandas indexadas). `.env.example` documentado.
- ⚠️ Ollama NÃO instalado nesta máquina → default stub. Plugar Ollama/fronteira = mudar env.
- ✅ **Chat com fonte rastreável** (`/dashboard/ia`): `chat.actions.ts` (`perguntarIA` → retrieval
  isolado + `gerar` citando fontes, tier LOCAL p/ não vazar dado), `ChatIA.tsx` (UI client com
  sugestões, fontes clicáveis → demanda). Link "Assistente" na nav. Retrieval testado (gab-a).
- **Embeddings = 1024** (bge-m3): coluna pgvector alterada à mão (Prisma não faz diff de Unsupported):
  `ALTER TABLE "Embedding" DROP/ADD COLUMN vetor vector(1024)`. DIM=1024 no config.
- **Deploy na hospedagem do usuário** (tem Ollama em localhost:11434 + Groq): no `.env` de lá →
  `IA_EMBED_PROVIDER=ollama` `IA_GEN_LOCAL=ollama` (bge-m3 + qwen2.5); fronteira = Groq
  (`IA_FRONTIER_URL=https://api.groq.com/openai/v1`, `IA_FRONTIER_MODEL=llama-3.3-70b-versatile`, colar KEY).
  Pré-requisito lá: `ollama pull bge-m3` e `ollama pull qwen2.5:14b`. Ref. infra: `D:hermes-pipeline`.
- ✅ **Demanda → proposição**: `proposicao.actions.ts` (`gerarProposicao`, tier FRONTEIRA) redige
  minuta de Indicação/Requerimento em PT legislativo a partir da demanda (isolado). UI
  `ProposicaoIA.tsx` (botão "Gerar minuta" na página da demanda → minuta editável + copiar/refazer).
- **DECISÃO de provedor (usuário tem OpenAI + Docker + Ollama)**: **OpenAI primário** — embeddings
  `text-embedding-3-small` com `dimensions=1024` (casa a coluna, intercambiável c/ bge-m3); geração
  OpenAI (gpt-4o no tier fronteira). Ollama fica como modo 100%-privado plugável (1 env). Config
  recomendada documentada no `.env.example` (bloco IA_OPENAI_*).
- ✅ **Copiloto estratégico** (`/dashboard/copiloto`): `copiloto.ts` (`montarSinais` cruza disputa×
  demandas abertas×contatos frios por bairro, isolado; `gerarAgendaSemana` → IA tier fronteira
  prioriza 3-5 bairros com justificativa). `CopilotoSemana.tsx` (botão + agenda + tabela de sinais).
  Link "Copiloto" na nav. Testado c/ OpenAI: priorizou bairros em disputa com raciocínio real.
- ✅ **OpenAI LIGADO** (testado): embeddings 1024 reais (ranking semântico correto), chat com fonte
  fundamentado, proposição e copiloto gerando texto real. `.env` com IA_OPENAI_*/IA_FRONTIER_* (gpt-4o-mini).
  ⚠️ chave foi exposta no chat → REVOGAR e gerar nova. Dev precisa restart p/ ler `.env`.
- 📋 **ROADMAP-MESTRE**: `docs/ROADMAP-INTELIGENCIA.md` organiza TODAS as features de inteligência
  em fases 3A–3F (conectores, vigilância proativa, agêntico, captura/WhatsApp, rede/executivo).
- ✅ **Conector Querido Diário** (`modules/conectores/querido-diario.ts`): busca diário oficial
  por código IBGE/termo/data, resiliente (degrada se Cloudflare bloquear), configurável `QD_API_URL`.
- ✅ **Vigia do Diário Oficial** (`modules/ia/vigia.ts`): cruza diário × bairros/nome do vereador →
  resumo IA + cria Alertas (isolados). UI `VigiaDiario.tsx` na página Copiloto. `Camara.codigoIbge`
  adicionado (Taquari=4321303). PoC `pnpm poc:vigia` 3/3 (resumo IA real + isolamento gab A≠B).
  ✅ Endpoint correto = https://api.queridodiario.ok.org.br (subdomínio api., NÃO /api do site/Cloudflare). FUNCIONA ao vivo. ⚠️ QD não cobre Taquari (município pequeno) → 0 resultados; funciona em cidades cobertas. Agenda e vigia salvam UM artefato (substituir) — agenda vence na virada da semana.
- ✅ **Persistência de artefatos IA** (`ConteudoIA`, escopo gabinete): agenda da semana e varredura
  do diário salvas no banco → sobrevivem à navegação (recarregam na página com "gerado em").
  `modules/ia/conteudo.ts` (`salvarConteudoIA`/`ultimoConteudoIA`). Isolamento testado (gab A≠B).
- ✅ **Conector SAPL** (`modules/conectores/sapl.ts`): API REST pública do Interlegis por câmara
  (`buscarMaterias` proposições/Indicações/Requerimentos + `listarParlamentares`). A URL mora em
  `Camara.saplUrl` (resolvida pelo TENANT, não hard-coded); resiliente (timeout + `ok:false`) como
  o Querido Diário. PoC `pnpm poc:sapl` 4/4 ao vivo: URL por tenant (gab A=B), busca real
  (2.800 matérias / 57 parlamentares de General Câmara), degradação quando câmara não tem SAPL.
  **DECISÃO**: feature **plugável, congelada** — SAPL não é universal (cada município pode usar
  sistema próprio sem API), valor é indireto e manutenção por câmara não escala. Seed deixa
  `saplUrl` de Taquari = **null** (realidade; não invade a demo). PoC usa General Câmara como alvo
  de teste embutido. Ligar só se a câmara-cliente usar Interlegis. Cruzar demanda↔proposição, se
  for o caso, fazer com a minuta que já mora no CRM — não dependendo de raspar terceiro.
- ✅ **Captura multimodal — voz + foto** (estende a Captura): áudio (gravar no navegador via
  MediaRecorder OU enviar áudio do WhatsApp) → **Whisper** (`transcrever`, OpenAI
  `/audio/transcriptions`, pt) → texto; foto (buraco/poste/bilhete) → **Visão** (`lerImagem`,
  chat multimodal na fronteira, gpt-4o-mini) → relato. Ambos preenchem o MESMO textarea e seguem
  o fluxo existente `estruturarDemanda → revisar → criarDemanda`. Server actions em
  `ia/captura.actions.ts` (`transcreverAudio`/`extrairRelatoDaImagem`, com guarda de auth, não
  gravam nada). Providers/gateway expõem `transcrever`/`lerImagem`. Config: `IA_OPENAI_TRANSCRIBE_MODEL`
  (whisper-1) e `IA_VISION_MODEL` (vazio=fronteira). Stub degrada com erro claro se faltar key.
  Typecheck limpo. ✅ **Validado ao vivo**: PoC `pnpm poc:captura` 6/6 (TTS→Whisper round-trip +
  foto real→Visão→demanda) E na tela `/dashboard/captura` (gravação de microfone + estruturação).
  Nota: Whisper pode trocar 1 letra esporádica — a etapa de estruturação reescreve e o assessor
  revisa antes de criar; não vale correção extra.
- ✅ **Agente Investigador** (`/dashboard/investigador`): IA **agêntica** (function-calling OpenAI)
  que responde pergunta estratégica em linguagem natural cruzando as fontes que já vivem no CRM.
  `modules/ia/investigador.ts` (`investigar(pergunta)` → loop de tool-calling, teto 6 passos,
  força resposta final se esgotar). **Ferramentas** = queries JÁ isoladas (cada uma faz seu
  `withTenant`): `panorama_bairros`(montarSinais), `mapa_disputa`(mapaDisputaParaPagina),
  `prestacao_bairro(bairro)`, `bairros_com_demandas`. ISOLAMENTO **herdado** — o agente não toca
  prisma direto e o modelo NUNCA recebe id de tenant (gabinete vem da sessão; args do modelo são
  só inócuos, ex.: nome de bairro). UI `Investigador.tsx` (pergunta + sugestões + dossiê markdown +
  chips de "fontes consultadas" como transparência). Link na nav após Copiloto. Usa IA_FRONTIER_*
  (tool-calling); degrada com erro claro se faltar key. Typecheck limpo, rota compila.
  ✅ **Validado ao vivo** na tela (gpt-4o-mini): loop de tool-calling chama as ferramentas e
  monta o dossiê com números reais; chips de "fontes consultadas" confirmam o cruzamento.
- ✅ **Envio real — seam + WhatsApp/Zernio** (`modules/comunicacao/`): seam provider-agnóstico
  `enviar({canal,nome,telefone,email,conteudo,template?})` → `ResultadoEnvio` (nunca lança).
  `whatsapp.ts` = adaptador **Zernio** (BSP oficial sobre Meta Cloud API; tier free; onboarding por
  embedded signup — escolhido porque o usuário desistiu da burocracia da Meta). Suporta **os dois
  modos**: texto livre (dentro de 24h) e **template aprovado** (notificação proativa fora de 24h).
  Worker (`comunicacoes.worker-core.ts`) usa o seam: resolve telefone/nome do cidadão, envia, só
  marca `enviadaEm` se ok (falha real → BullMQ reprocessa). Canal REGISTRO/EMAIL/SMS segue **no-op**
  (comportamento atual preservado) — só WHATSAPP entrega de verdade quando configurado. Template por
  tipo via env `ZERNIO_TEMPLATE_<TIPO>`. PoC `pnpm poc:envio` 4/4 (roteamento + degradação + E.164).
  ⚠️ **ENDPOINT 1:1 da Zernio NÃO confirmado** (doc pública é JS-render; rota `/messages` é palpite)
  → confirmar no painel autenticado e ajustar `ZERNIO_SEND_PATH`/corpo. Tudo configurável por env.
  Trocar de provedor (Meta direto/360dialog) = reescrever só `whatsapp.ts`.
- ⬜ Próximo (ver roadmap): deploy Docker · confirmar endpoint Zernio + testar envio real · (SAPL congelado).

## 12.6. Sistema de UI — direção "Atlas" (dark SaaS) + padrão de cadastro

Mockups das 3 direções em `docs/mockups/` (abrir `index.html`). Escolhida: **Atlas** (sidebar
escura, acento azul). Implementado:
- **Primitivos** `src/components/ui/primitives.tsx`: `PageHeader`, `Panel`/`PanelHeader`,
  `Button`/`ButtonLink` (primary/ghost/danger, active:scale), `Field`+`Input`/`Select`/`Textarea`,
  `Badge` (tones), `Table`/`Th`/`Td`/`Tr`, `EmptyState`. Polish: tabular-nums, foco com anel,
  hit area ≥40px, text-wrap. Server-components puros (sem hooks) → convivem com server actions.
- **Shell Atlas**: `dashboard/layout.tsx` (sidebar slate-900, brand, rodapé de usuário com Sair) +
  `DashboardNav` (grupos Gabinete/Ações, ícones, item ativo).
- **Padrão aplicado** (referência): `cidadaos` e `demandas` = `PageHeader` + `Panel`(form com
  `Field`) + `Panel`(listagem em `Table`). É o template pra replicar nos demais cadastros.
- ⬜ **Falta propagar** o padrão: documentos, disparo, comunicações, detalhe de cidadão/demanda,
  e harmonizar páginas do Radar/Prestação com os primitivos.

## 12.5. Inteligência política "que vende" (decisão de produto 2026-06-25)

> Radar puro descreve o passado — vereador vive da rua e da próxima eleição. O que VENDE é o
> arco **CAPTURAR (rua) → PROVAR (bairro) → MIRAR (rival)**. Nervos do comprador: medo (perder
> pro rival) e orgulho (mostrar serviço).

- ✅ **#1 Mapa de Disputa** (`/dashboard/radar/disputa`): meu candidato × líder de cada bairro
  → meu território (verde) / em disputa ≥50% (âmbar) / do rival (vermelho). `mapaDisputa` em
  radar.queries usa todos os candidatos do TSE. Exige `Gabinete.candidatoTse` (nome EXATO do TSE)
  — **mudança de schema** (campo nullable). Seed gab-a = "LUCIANO FABIANO MARIA DA SILVA"
  (demo: 3 meu / 4 disputa / 10 rival; Ademir Bica Fagundes domina o Centro). Botão na página do
  Radar. ⚠️ após db push, reiniciar dev E worker (Prisma Client).
- ✅ **#2 Prestação de contas por bairro** (`/dashboard/prestacao`): seletor de bairro → relatório
  "seu vereador trabalhou aqui" (resolvidas / em andamento / retornos + temas + lista entregue).
  `modules/crm/prestacao.queries.ts` (`listarBairrosComDemandas`, `prestacaoDoBairro`,
  `textoPrestacaoWhatsApp`). Botões copiar / WhatsApp (wa.me) / imprimir-PDF
  (`components/PrestacaoAcoes.tsx`). Link na DashboardNav. Seed enriquecido: 8 demandas em
  bairros do Radar, 5 resolvidas + 5 comunicações (Centro 2/3) — popula prestação E o cruzamento.
- ⬜ **#3 Assistente WhatsApp de captura** (motor de retenção; fase própria, deps externas:
  provedor WhatsApp, número, custo, IA p/ estruturar texto). Núcleo testável: texto livre →
  demanda estruturada → inserir no CRM ISOLADO (resolver gabinete pelo número; comTenantDoJob,
  não sessão). WhatsApp = adaptador plugável. Atenção LGPD + PoC de isolamento (inserção fora de
  sessão logada).

## 12. Próximos passos
- **Fase 2 — Radar do Mandato** (em andamento):
  - ✅ **Import TSE → `ResultadoEleitoral`** feito: `modules/radar/tse-parse.ts` (parser puro,
    corrige mojibake UTF-8-duplo do CSV) + `tse-import.ts` (lê latin1→utf8, `createMany`
    isolado por câmara, idempotente por ano/cargo). PoC `pnpm poc:radar` prova isolamento
    entre câmaras. Import operacional: `pnpm radar:importar [csv] [camaraId]` (3.030 linhas OK).
  - ✅ **Agregação por bairro** feita: geocodificação grátis (Nominatim) só acerta ~50% dos
    endereços rurais de Taquari → decisão: **tabela curada** dos 22 locais
    (`spike-crm/amostras/locais-votacao-taquari.json`, lat/lng + bairro + confiança).
    `modules/radar/agregacao.ts` vincula local→`UnidadeTerritorial` (bairro; geojson = Point
    centroide INTERINO até a malha IBGE). `modules/radar/radar.queries.ts`: `agregarVotosPorBairro`,
    `agregarVotosPorSecao` (fallback sempre disponível), `rankingCandidatos` — tudo isolado por
    câmara (groupBy passa pela extensão). Rodar: `pnpm radar:agregar`. PoC: `pnpm poc:radar-bairro`.
    Resultado real Taquari: 17 bairros, 68 seções, 15.855 votos (Centro 4.226 no topo).
  - ⬜ **malha IBGE** (RS_bairros_CD2022): trocar o Point centroide por polígono real do bairro (visual).
  - ✅ **UI do Radar** (`/dashboard/radar`): mapa Leaflet com centroides por bairro (tamanho =
    votos, cor = densidade de demandas do gabinete) + cards + tabela de ranking voto×demanda.
    `modules/radar/radar.queries.ts` `cruzamentoBairroVotoDemanda` (junta câmara×gabinete, casa
    bairro por nome normalizado) → `radar.ui.ts` (session-aware, withTenant) →
    `components/mapa/MapaRadar*.tsx`. Link na `DashboardNav`. Rota compila e protegida por auth.
  - ✅ **Insight de oportunidade**: `radar.ui.ts` calcula bairros "muito voto, pouca demanda"
    (voto ≥ mediana E demanda ≤ média) → destaque 🎯 no topo da página. Real Taquari: 5 flagados
    (Colônia 20 de Setembro 2.092v/0d, Léo Alvim Faller, São João, Santo Antônio, Coqueiros).
  - ⬜ **malha IBGE** (RS_bairros_CD2022): trocar Point centroide por polígono real do bairro (visual).
  - ✅ **Bairro padronizado no form de demanda**: input com `<datalist>` alimentado por
    `listarBairrosConhecidos()` (UnidadeTerritorial) → demandas casam melhor com o Radar, sem
    bloquear bairro novo.
  - ✅ **Drill-down por bairro** (`/dashboard/radar/[unidadeId]`): ranking de candidatos no bairro
    (`bairroDetalhe` → `rankingCandidatos`), com barra de peso. Linkado da tabela e do popup do mapa.
    Real: Centro → ADEMIR BICA FAGUNDES 264, ANGELICA SILVA HASSEN 248…
  - ✅ **Malha IBGE (polígonos reais)**: verificado que o CD2022 TEM bairros de Taquari (código
    correto **4321303**, não 4321204) — 12 bairros oficiais. Extraído de `RS_bairros_CD2022.zip`
    (shapefile SIRGAS2000 ≈ WGS84) → `spike-crm/amostras/bairros-taquari.geojson` (12 features,
    23 KB, versionado). `agregacao.ts` (`lerPoligonosBairros`) grava o polígono na
    `UnidadeTerritorial.geojson` quando o nome casa (senão mantém Point centroide). Mapa
    (`MapaRadar`) desenha `<GeoJSON>` pros bairros com polígono e CircleMarker pros rurais.
    Real: **9 bairros com polígono** (urbanos com local de votação), 8 rurais com ponto.
    Nome alinhado: tabela curada usa "Colônia Vinte de Setembro" (canônico IBGE).
  - ℹ️ IBGE só mapeia bairro onde há lei municipal; localidades rurais (Costa do Capivara,
    Fazenda Pereira, etc.) não são bairros IBGE → seguem como ponto/centroide.
  - ⚠️ Tabela curada tem entradas `confianca: baixa` (locais rurais sem coordenada confiável) — o
    gabinete pode refinar lat/lng/bairro à mão no JSON; reaplicar com `pnpm radar:agregar`.
- **Fase 3 — IA**: embeddings (pgvector pronto) → chat com fonte rastreável; demanda→proposição.
- Item pendente menor: trocar o **stub de envio** por Resend/WhatsApp real no worker-core.
