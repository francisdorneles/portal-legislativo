# Premissas CRM / Inteligência Política — Spike Fase 0

> Documento vivo. Preenchido com **evidência** (dado real baixado, query rodada, custo
> medido), não com fé. Mesma regra do portal (Regra 2/3): validar antes de codar produto.
> Se uma premissa quebrar, a ordem de construção do CRM (`docs/Arquitetura-CRM-Radar-IA.md`)
> é reescrita aqui.
>
> Contexto: o CRM é produto **à parte** do portal público. Arquitetura em
> `docs/Arquitetura-CRM-Radar-IA.md`. Política de processo em `docs/politica-gsd.md`.

## Por que este documento existe

O gargalo do CRM não é organização — é **risco técnico externo não validado**. São 4
riscos que, se quebrarem, mudam o produto. Validar AGORA, antes de criar o repo, evita
construir o Radar inteiro em cima de um dado que não existe.

| # | Risco | Se quebrar… |
|---|---|---|
| 1 | TSE por seção (votos baixáveis p/ Taquari/RS) | Radar perde a camada eleitoral; reposicionar diferencial |
| 2 | Geometria de seção eleitoral | Radar agrega por **bairro**, não por seção — muda toda a Fase 2 |
| 3 | Isolamento multi-tenant (Câmara→Gabinete) | Re-arquitetar a fundação antes de qualquer feature |
| 4 | IA com fonte rastreável (custo/latência/confiabilidade) | IA vira assistente opcional, não núcleo vendável |

---

## Premissa 1 — Dados eleitorais do TSE por seção são públicos e baixáveis
"O Radar cruza voto por seção com demanda e atuação."

O que validar com evidência:
- Os **resultados por seção** (candidato, partido, votos, cargo=vereador, ano) existem
  para o município-alvo (**Taquari/RS**) e são baixáveis? (Portal de Dados Abertos do TSE —
  arquivos de votação por seção, por UF/ano.)
- Formato e granularidade: chega no nível **seção** (não só zona/município)?
- Volume e periodicidade (dado muda só em eleição → importação periódica, não tempo real).

Como obter evidência:
```
# Baixar pacote "votação por seção" da UF RS no portal de dados abertos do TSE
# (eleições municipais mais recentes), filtrar município = Taquari, cargo = Vereador.
# Conferir: tem coluna de seção? votos por candidato por seção batem com total?
```
Amostra crua → `spike-crm/amostras/tse-secao-taquari.csv` (a baixar).

**Evidência (2026-06-24, web):** o TSE publica **Boletim de Urna 2024 por UF** (RS incluído),
em **CSV (.zip)**, no Portal de Dados Abertos. O boletim de urna é granular **por seção**,
com votos por candidato. Dataset: `dadosabertos.tse.jus.br/dataset/resultados-2024-boletim-de-urna`.
Há também "votação nominal por seção" no conjunto `resultados-2024`. Importação periódica
(dado muda só em eleição). Falta só baixar o RS e filtrar Taquari/Vereador pra confirmar campos.

**Evidência fechada (2026-06-24, dado baixado):** baixado `votacao_secao_2024_RS.zip` (96 MB →
CSV 560 MB, latin1, `;`) de
`cdn.tse.jus.br/estatistica/sead/odsele/votacao_secao/votacao_secao_2024_RS.zip`.
Filtrado **Taquari / Vereador / 2024 (1º turno)**:
- **3.030 linhas**, **68 seções** (zona 56), **75 candidatos/votáveis**, **22 locais de
  votação**, **15.855 votos** somados.
- Campos por linha: `NM_MUNICIPIO`, `NR_ZONA`, `NR_SECAO`, `DS_CARGO`, `NR_VOTAVEL`,
  `NM_VOTAVEL`, `QT_VOTOS`, `SQ_CANDIDATO`, **`NM_LOCAL_VOTACAO`** e
  **`DS_LOCAL_VOTACAO_ENDERECO`** (endereço → geocodificável, alimenta o Plano B de geometria).
- Amostra salva: `spike-crm/amostras/tse-secao-taquari-vereador-2024.csv` (UTF-8, só Taquari/Vereador).

**Veredito 1:** ☑ **CONFIRMADA 100% (dado real validado)** — votos por seção e por candidato
existem, públicos, baixáveis por UF, com endereço do local de votação. Risco eliminado.

---

## Premissa 2 — Existe geometria (polígono) da seção eleitoral
"Camadas do Radar desenham voto/demanda no mapa por seção."

⚠️ **Este é o risco mais provável de quebrar.** O TSE no Brasil historicamente **não**
publica polígono de seção eleitoral pronto. Local de votação tem endereço (ponto), não
polígono de área de abrangência.

O que validar:
- Há shapefile/GeoJSON oficial de **área de seção**? (provavelmente não)
- Plano B: georreferenciar pelo **local de votação** (ponto) + agregação por **bairro**
  (malha de bairros / setores censitários do IBGE existe e é baixável).
- Plano C: trabalhar por **bairro** como unidade territorial do Radar desde o início.

Como obter evidência:
```
# Procurar no portal do TSE / IBGE por malha de seção. Conferir IBGE: malha de setores
# censitários e/ou bairros de Taquari (shapefile). Avaliar se "voto por seção" consegue
# ser amarrado a um polígono territorial qualquer.
```

**Evidência (2026-06-24, web):**
- Confirmado que o TSE **não** publica polígono de seção eleitoral (só local de votação = ponto).
- O **IBGE publica malha de bairros do Censo 2022 por UF**, em shapefile. Arquivo de RS
  existe: **`RS_bairros_CD2022.zip`** (1.5 MB), em
  `geoftp.ibge.gov.br/.../censo_2022/bairros/shp/UF/`. Há também setores censitários.
- Caminho viável: amarrar voto da seção ao **local de votação (ponto, geocodificável)** e
  agregar por **bairro** (polígono do IBGE).

**Veredito 2:** ☑ **QUEBRADA como "por seção" / MITIGADA por bairro.** O Radar usa **bairro**
(malha IBGE RS) como unidade territorial. Sem bloqueio — só muda o desenho.
**Decisão derivada (travada):** o modelo `SecaoEleitoral` da arquitetura passa a ser
`UnidadeTerritorial` (bairro) com voto/demanda **agregados**. Atualizar
`docs/Arquitetura-CRM-Radar-IA.md` ao iniciar a Fase 2. (Reforça também a regra LGPD:
trabalhar agregado, nunca individualizar eleitor.)

---

## Premissa 3 — Isolamento multi-tenant é confiável (Câmara → Gabinete)
"CRM isolado por gabinete; nenhum gabinete vê dado de outro."

O que validar:
- A Prisma Extension de isolamento automático (injetar `camaraId`/`gabineteId` em toda
  query) cobre **todos** os caminhos — incluindo agregações, raw queries e jobs BullMQ?
- Auth.js carrega o contexto de tenant de forma confiável na sessão?
- Teste de vazamento: usuário do Gabinete A consegue, por qualquer rota/ID, ler dado do B?

Como obter evidência:
```
# Provar conceito mínimo: 2 gabinetes, 1 cidadão em cada, extension ativa.
# Tentar ler/listar cruzado por ID direto e por query agregada. Deve dar 0 / negar.
```
Isto é risco **interno** (arquitetural), não externo — mas decide a fundação inteira,
então valida-se junto.

**Evidência (2026-06-24, PoC rodando):** repo `D:\crm-legislativo`. Prisma Extension de
isolamento (`src/lib/prisma.ts`) + contexto via `AsyncLocalStorage` (`src/lib/tenant-context.ts`).
PoC `scripts/poc-isolamento.ts` (2 gabinetes na mesma câmara) passou nos 5 testes:
1. create grava `gabineteId` correto; 2. `findMany` não vê dado de outro gabinete;
3. `findUnique` por id alheio → null; 4. `updateMany` cruzado → 0 alterações;
5. sem contexto (admin/seed) vê tudo.

⚠️ **Armadilha encontrada e documentada:** promises do Prisma são **lazy** — o filtro de
isolamento só roda no `await`. O wrapper de tenant tem que envolver o **await**, não só a
criação da promise (senão o `AsyncLocalStorage` já saiu de escopo e o isolamento não aplica).
Em produção: o middleware de request precisa manter o contexto vivo até o fim do await.

**Veredito 3:** ☑ **CONFIRMADA (PoC)** — isolamento automático por gabinete funciona.

**Avanço Fundação (2026-06-24):**
- Escopo por modelo na extensão: CRM (Cidadao/Demanda) → **gabinete**; geo/IA
  (UnidadeTerritorial/ResultadoEleitoral/Embedding) → **câmara**. pgvector ativo.
- Login e-mail+senha (bcrypt): núcleo testável `src/modules/auth/auth-core.ts`
  (`verificarCredenciais`). PoC `scripts/poc-auth.ts` (4/4): senha errada/e-mail
  inexistente rejeitados; login válido devolve o tenant; sob a sessão o isolamento vale.
- Ponte sessão→tenant `src/lib/with-tenant.ts` (`withTenant`) e job→tenant
  `comTenantDoJob`: **ambos garantem o await dentro do contexto** (correção da armadilha
  lazy do Prisma), então o chamador não precisa lembrar disso.
- **App Next.js de pé:** Auth.js v5 (Credentials) plugado no `auth-core`; sessão JWT
  carrega `tenant` (camara/gabinete); página de login + dashboard protegido (`/dashboard`
  redireciona p/ `/login` sem sessão). Tailwind v4. Seed demo (`pnpm db:seed`).
- **Isolamento provado ponta a ponta via HTTP real:** login → dashboard lista só os 2
  cidadãos do gabinete A; o cidadão do gabinete B **nunca** aparece.

⚠️ **2ª armadilha (documentada):** o bundler do Next instancia o módulo `tenant-context`
mais de uma vez (imports via alias `@/` vs relativo `./`) → `AsyncLocalStorage` duplicado →
isolamento quebra silenciosamente (admin vê tudo). Pegou só no app, não no PoC headless.
Correção: ancorar o `tenantStore` em `globalThis` (uma instância garantida). Também:
`extensionAlias` no `next.config.ts` p/ resolver imports `.js`→`.ts`.

- Pendência restante p/ produção: raw queries ($queryRaw) seguem fora da extensão →
  filtrar manualmente. Próximo: BullMQ instanciado e design system de verdade.

---

## Premissa 4 — IA "com fonte rastreável" é viável (custo, latência, confiabilidade)
"Toda resposta de IA cita fonte, nunca inventa; revisão humana em ato oficial."

O que validar (com número real, não impressão):
- **Custo** por consulta do chat (embeddings + LLM) num volume realista de gabinete.
- **Latência** aceitável pra uso interativo.
- **Confiabilidade do "só com fonte":** o roteador (pgvector semântico + SQL estruturado)
  consegue recusar/avisar quando não há fonte, em vez de alucinar?
- Geração demanda→proposição: qualidade de rascunho aceitável com revisão humana?

Como obter evidência:
```
# Protótipo mínimo: indexar ~50 demandas fictícias + alguns trechos de norma em pgvector.
# Rodar 10 perguntas (5 com fonte, 5 sem) e medir: cita fonte? recusa quando não tem?
# custo/latência por chamada. Registrar números aqui.
```
Ver também `docs/SAPL-IA-Arquitetura.md` (arquitetura de IA já esboçada para o legislativo).

**Veredito 4:** ☐ confirmada ☐ parcial ☐ quebrada — _a preencher_

---

## Decisão resultante
> Preencher após o spike. Se 1/3/4 confirmadas e 2 mitigada (bairro) → seguir a ordem de
> construção do `docs/Arquitetura-CRM-Radar-IA.md`. Se algo quebrar → registrar aqui o
> novo plano e ajustar a arquitetura.

| Premissa | Veredito | Impacto no plano |
|---|---|---|
| 1 — TSE por seção | ☑ **confirmada 100% (dado real)** | Sem mudança. 3.030 linhas Taquari/Vereador validadas. |
| 2 — Geometria de seção | ☑ mitigada → **bairro** (IBGE RS) | Radar por bairro; `SecaoEleitoral`→`UnidadeTerritorial`. |
| 3 — Multi-tenant | ☑ **confirmada (PoC roda)** | Prisma Extension + AsyncLocalStorage. Repo `D:\crm-legislativo`. |
| 4 — IA com fonte | ☐ pendente | Prototipar custo/latência/recusa-sem-fonte. |
