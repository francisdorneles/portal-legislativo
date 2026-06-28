# Arquitetura — Plataforma Legislativa (Fundação + CRM + Radar + IA)

> Versão atualizada após definição do produto. Incorpora: IA como núcleo do CRM,
> módulo "Radar do Mandato" (mapa preditivo com dados eleitorais TSE), e funcionalidades
> de inteligência política. A FUNDAÇÃO não muda — muda o escopo do módulo, que cresce
> de "CRM de cadastro" para "plataforma de inteligência política".

---

## Decisões fundamentais (fechadas)

| Decisão | Escolha |
|---|---|
| Multi-tenant | Câmara (nível 1) + Gabinete (nível 2) |
| SAPL | Um por câmara, isolado, via API, com `saplUrl` no cadastro |
| Primeira versão | Leitura SAPL + CRM (escrita depois) |
| CRM — visibilidade | Isolado por gabinete |
| Autenticação | Login próprio (Auth.js), Gov.br futuro |
| Interface | Web responsivo |
| Stack | Next.js + Prisma + Postgres + Payload + BullMQ/Redis |
| **IA** | **Núcleo do produto, não enfeite** |
| **Dados eleitorais TSE** | **Sim — base do Radar do Mandato** |
| Posicionamento IA | Rastreável, segura, auditável (padrão setor público) |

---

## A FUNDAÇÃO (inalterada — serve todos os módulos)

Tenancy (Camara + Gabinete + Usuario), Prisma Extension de isolamento automático,
Auth.js com contexto de tenant, camada saplClient multi-instância, BullMQ+Redis,
design system. **Nada disso muda.** Detalhe completo no documento anterior.

Adições à fundação para suportar IA e Radar:
- **pgvector** no Postgres (embeddings) — sai de "futuro" para "núcleo"
- **schema geo** para dados territoriais e eleitorais
- **job de indexação** de embeddings na fila BullMQ

---

## MÓDULO CRM — agora "Plataforma de Inteligência Política"

### Modelo de dados (expandido)

```
Cidadao
├── camaraId, gabineteId
├── nome, cpf, nascimento, telefone, email
├── endereco, lat, lng, bairro, secaoEleitoral
├── tags (N:N), tipoContato (cidadão / liderança)
├── statusRelacionamento (quente / esfriando / frio)  ← termômetro
├── ultimoContato (data)                               ← agenda de relacionamento
└── observacoes

Lideranca  (subtipo / flag em Cidadao)
├── tipoLideranca (associação, religiosa, comércio…)
├── influenciaEstimada
└── regiaoInfluencia

Demanda
├── camaraId, gabineteId, cidadaoId
├── titulo, descricao, tema (saúde, asfalto, iluminação…)
├── status (ABERTA / EM_ANDAMENTO / ENCAMINHADA / RESOLVIDA)
├── lat, lng, bairro
├── materiaIdSapl (nullable)        ← virou proposição no SAPL
├── prazo, prioridade
├── origem (manual / whatsapp / portal)
└── historico → MovimentacaoDemanda

ProposicaoGerada                     ← demanda → ato legislativo
├── demandaId, gabineteId
├── tipo (indicação / requerimento / ofício / PL)
├── textoGerado (IA)
├── status (rascunho / protocolado)
└── materiaIdSapl (após protocolo)

DocumentoGabinete
├── camaraId, gabineteId
├── tipo, numero, destinatario, status, prazo, arquivoUrl

ComunicacaoEnviada                   ← prova de trabalho / disparo segmentado
├── gabineteId, cidadaoId
├── canal (email / sms / whatsapp)
├── tipo (aniversário / demanda resolvida / boletim)
└── data, conteudo

-- GEO / ELEITORAL (schema geo) --
SecaoEleitoral
├── camaraId
├── codigo, zona, secao
├── bairro, lat, lng, geometria (polígono)
└── totalEleitores

ResultadoEleitoral                   ← dados públicos do TSE
├── camaraId
├── secaoEleitoralId
├── candidatoNome, partido, ano
├── votos
└── cargo (vereador)

-- IA --
Embedding
├── camaraId
├── origem (demanda / materia_sapl / norma)
├── referenciaId
├── texto (chunk)
└── vetor (pgvector)
```

### Funcionalidades — núcleo (primeira versão vendável)

| Funcionalidade | Como |
|---|---|
| Cadastro de cidadãos/lideranças com tags | Prisma + UI |
| Demandas com status, tema, histórico | Prisma |
| Demanda no mapa | Google Maps (lat/lng) |
| Termômetro de relacionamento | status + ultimoContato |
| Agenda de relacionamento (cutuca) | cron BullMQ ("não fala com X há N meses") |
| Aniversários personalizados | cron + Resend |
| WhatsApp Web pelo telefone | link wa.me |
| Disparo segmentado por tag/região | BullMQ + Resend/SMS |
| Prova de trabalho automática | ao resolver demanda → ComunicacaoEnviada |
| Documentos do gabinete + mala direta | Prisma + PDF |
| Painel de desempenho do mandato | dashboard sobre os dados |

### Funcionalidades — IA (o diferencial, núcleo)

| Funcionalidade | Como | Regra |
|---|---|---|
| Demanda → proposição assistida | IA redige indicação/requerimento/ofício | revisão humana antes de protocolar |
| Chat de consulta (CRM + território) | roteador: semântico (pgvector) + estruturado (SQL) | só responde com fonte rastreável |
| Mapa que conversa | pergunta natural → resposta visual no Radar | idem |
| Alerta de oportunidade | IA detecta padrão ("15 pedidos de iluminação no bairro Z") | sugere ação |
| Previsão de demanda sazonal | ML sobre histórico | sugestão, não certeza |
| Análise de sentimento da base | NLP sobre mensagens/demandas | sinaliza erosão |
| Assistente de estratégia | cruza dados + calendário eleitoral | recomenda foco |
| Resumo / linguagem cidadã | sumarização de matérias | transparência |

---

## MÓDULO "RADAR DO MANDATO" (mapa preditivo)

> Não é mapa de presença (passado) — é mapa que ORIENTA a próxima ação (futuro).
> Diferencial central: ativo, não passivo.

### Camadas de visualização (sobreposições no mapa)

- Demandas abertas vs resolvidas por região (taxa de entrega visível)
- Densidade de demanda por tema (onde chove pedido de quê)
- Calor de relacionamento (tempo desde última atuação por território)
- **Votação por seção (TSE):** onde teve voto, onde não teve
- **Cruzamento estratégico:**
  - teve voto + sem atuação recente = base esfriando (vermelho)
  - sem voto + resolvendo demanda = base crescendo (verde)
  - muita demanda + nenhum vereador atuando = bairro órfão (oportunidade)
- Sazonalidade prevista (IA marca região que vai demandar X)

### Fontes de dados do Radar

- **Demandas/cidadãos** → schema operacional (CRM)
- **Votação por seção** → schema geo (importação de dados públicos do TSE)
- **Geometria de bairros/seções** → base geográfica (IBGE/TSE)
- **Predição** → IA sobre histórico de demandas

### Sobre os dados do TSE

- São públicos (resultados por seção/zona, candidato, votos).
- Importação periódica (não tempo real — dado eleitoral muda só em eleição).
- Atenção LGPD/ética: trabalhar com dado **agregado por seção**, não individualizar eleitor.
- O dado é por seção (não diz quem votou em quem) — é estatística territorial, legal e pública.

---

## Ordem de construção (revisada)

```
FASE 0 — FUNDAÇÃO
  tenancy, auth, prisma extension, saplClient, BullMQ, design system,
  + pgvector + schema geo

FASE 1 — CRM NÚCLEO (o que vende rápido)
  cidadãos, lideranças, demandas, mapa básico, termômetro,
  aniversários, WhatsApp, disparo segmentado, prova de trabalho,
  documentos, painel de mandato

FASE 2 — RADAR DO MANDATO
  importação TSE, geometria, camadas de visualização,
  cruzamento estratégico (voto × demanda × atuação)

FASE 3 — IA (núcleo do diferencial)
  embeddings (demandas + sapl_cache), chat com fonte,
  demanda → proposição assistida, mapa que conversa,
  alertas, previsão sazonal, assistente de estratégia

FASE 4+ — demais módulos reusando a fundação
  portal, ouvidoria/SIC, escrita SAPL, (Frente B sob demanda)
```

---

## O que mudou em relação à arquitetura anterior do CRM

1. **IA saiu de "futuro" para núcleo** — pgvector na fundação, chat e geração de proposição
   como parte central do produto.
2. **Novo módulo Radar do Mandato** — mapa preditivo com camadas e cruzamento estratégico.
3. **Dados eleitorais do TSE** — novo schema geo (SecaoEleitoral, ResultadoEleitoral).
4. **Modelo de dados expandido** — lideranças, termômetro de relacionamento, proposição
   gerada, comunicação enviada, embeddings.
5. **CRM reposicionado** — de "cadastro + demanda" para "plataforma de inteligência política".

**A fundação (tenancy, SAPL, auth, stack) permanece idêntica.**

---

## Posicionamento (validado pelo mercado — ref. Softplan)

IA no setor público vende por **confiança**: rastreável, auditável, segura, humana.
Toda funcionalidade de IA do produto segue a regra inegociável: responde com fonte,
nunca inventa, revisão humana em artefatos oficiais. Esse é o pilar de venda, não a
tecnologia em si.
