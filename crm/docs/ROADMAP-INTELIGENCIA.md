# Roadmap — Inteligência do Mandato (Fase 3+)

> Organiza TODAS as funcionalidades de inteligência em fases, por dependência e infra
> compartilhada. Cada feature reusa a fundação já pronta: **gateway de IA agnóstico**
> (`modules/ia`), **RAG isolado por gabinete**, **BullMQ** (jobs/cron), **Radar** (TSE/disputa).
> Regra do projeto vale pra todas: **PoC provando isolamento** em features de dado.

## ✅ Fase 3A — IA núcleo (PRONTO)
- Gateway agnóstico (stub/Ollama/OpenAI) + embeddings + RAG isolado (PoC 4/4).
- Chat com fonte rastreável (`/dashboard/ia`).
- Demanda → proposição.
- Copiloto estratégico (agenda da semana).
- OpenAI ligado e testado.

## 🔌 Fase 3B — Conectores de dados externos (FUNDAÇÃO da proatividade)
Plumbing que muitas features dependem. Cada conector = `modules/conectores/<fonte>.ts`,
testável isolado, com cache.
- **B1. Querido Diário** (diário oficial municipal — API OK Brasil, grátis). → destrava Vigia.
- **B2. SAPL** (Interlegis — proposições/tramitação/pauta da câmara). cms já mexe com SAPL.
- **B3. IBGE socioeconômico** (renda/população por setor/bairro). Já usamos malhas IBGE.
- **B4. Clima** (previsão p/ antecipar alagamento/demanda).
- **B5. Notícias** (RSS/Google News local + rivais).

## 📡 Fase 3C — Vigilância proativa (depende de 3B + BullMQ)
- **C1. Vigia do Diário Oficial** — cruza diário × bairros/temas/indicações → alerta + resumo IA.
- **C2. Monitor de rivais** — diário/SAPL/notícias dos adversários → alerta.
- **C3. Detector de oportunidade legislativa** — edital/verba no diário → "proponha agora".
- **C4. Antecipador de demandas** — clima + histórico → alerta de alagamento por bairro.
- **C5. Agente diário / briefing matinal** — job que monta o resumo do dia (copiloto+diário+CRM).

## 🤖 Fase 3D — Agêntico avançado (fusão de fontes)
- **D1. Agente Investigador (dossiê)** — tema → cruza demandas+diário+SAPL+IBGE+notícias → dossiê.
- **D2. Co-redação de Projeto de Lei** — busca leis similares + adapta projeto completo.
- **D3. Análise de vácuo** — temas/bairros sem atendimento → oportunidade.

## 💬 Fase 3E — Captura & escala (WhatsApp — infra `D:\hermes-pipeline`)
- **E1. Captura por voz/foto** — Whisper (áudio) + Vision (foto) → demanda estruturada no CRM.
- **E2. Atendimento automático ao cidadão** — bot acolhe/registra/dá protocolo (humano no loop).
- **E3. Pesquisa-relâmpago** — dispara pergunta segmentada → IA tabula respostas.

## 📊 Fase 3F — Rede & visão executiva
- **F1. Grafo de influência / cabos dormentes** — rede de lideranças, quem move votos.
- **F2. Índice de Saúde do Mandato** — score: disputa+produção+demandas+relacionamento.
- **F3. Gerador de conteúdo** — demanda resolvida → post/WhatsApp/nota à imprensa.
- **F4. Briefing por voz (TTS)** — resumo do dia em áudio.
- **F5. Simulador eleitoral** — "se eu virar N bairros em disputa, me reelejo?".

## Ordem de execução recomendada
1. **3B1 (Querido Diário)** → **3C1 (Vigia)** — o "uau" único, proativo.
2. **3E1 (Captura voz/foto)** — motor de retenção.
3. **3B2 (SAPL)** → **3D1 (Agente Investigador)** — a IA agêntica que impressiona.
4. **3F2 (Índice de Saúde)** + **3F3 (Gerador de conteúdo)** — visão executiva + marketing.
5. Demais conforme valor/feedback.

## Princípios transversais
- Tudo isolado por gabinete (regra sagrada). Conectores externos são dado público/compartilhado.
- IA agnóstica: tarefa cara→local, difícil→fronteira. Privacidade: dado do cidadão não sai (local).
- Cada feature de dado nova → PoC de isolamento.
- **PROATIVO POR PADRÃO**: tudo que é varredura/análise (vigia do diário, agenda do copiloto, monitor de rivais, oportunidades) deve rodar em CRON DIÁRIO (BullMQ, ~05:00) e entregar pronto no dashboard de manhã. O usuário não pede — o sistema já fez. Captura: IA só pra texto longo/áudio; texto curto vai direto ao form.
- Proatividade via BullMQ (já no stack): jobs com contexto admin varrem todos os gabinetes.
