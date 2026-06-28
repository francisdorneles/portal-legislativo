# Inteligência do Produto — CRM Político / Radar do Mandato

> Este documento NÃO é arquitetura (estrutura técnica). É a INTELIGÊNCIA: as regras,
> fórmulas, gatilhos e lógicas que fazem cada funcionalidade funcionar de verdade e
> diferenciar do CRM comum. É aqui que mora o valor. A arquitetura diz "tem um termômetro
> de relacionamento"; este documento diz EXATAMENTE como o termômetro decide quente/frio.

---

## 1. TERMÔMETRO DE RELACIONAMENTO

**O que faz:** classifica cada cidadão/liderança em quente / morno / frio, automaticamente.

**Lógica (não é só "última conversa"):**
```
Pontuação de relação = combinação ponderada de:
  - Recência do último contato (peso alto)
  - Frequência de contato nos últimos 12 meses
  - Demandas resolvidas para essa pessoa (gera vínculo positivo)
  - Demandas abertas há muito tempo (gera vínculo NEGATIVO — esfria)
  - Se é liderança (peso maior — perder liderança custa mais votos)

Faixas:
  QUENTE   = contato recente E (demanda resolvida recente OU liderança ativa)
  MORNO    = sem contato há 2-4 meses, sem pendência
  ESFRIANDO= sem contato há 2-4 meses E tem demanda aberta sem resposta
  FRIO     = sem contato há +4 meses
  EM RISCO = liderança fria OU demanda da pessoa estourou prazo sem retorno
```

**O diferencial:** o CRM comum mostra "último contato: 12/03". O teu **interpreta** isso e
diz "essa liderança está em risco, fale com ela essa semana". Decisão, não dado.

**Gatilho de ação:** todo cidadão que entra em ESFRIANDO/EM RISCO gera item na Agenda de
Relacionamento (seção 2).

---

## 2. AGENDA DE RELACIONAMENTO (o "cutuca")

**O que faz:** lista priorizada de quem o vereador precisa contatar, sem ele pedir.

**Lógica de priorização (ordem do que aparece primeiro):**
```
1. Lideranças EM RISCO (maior impacto eleitoral)
2. Demandas resolvidas ainda não comunicadas ao cidadão (oportunidade de crédito)
3. Aniversários da semana (lideranças primeiro)
4. Promessas registradas com prazo vencendo
5. Cidadãos ESFRIANDO em regiões de voto forte (cruzamento com Radar)
6. Demandas paradas há mais de X dias sob responsabilidade do gabinete
```

**O diferencial:** ele transforma um banco de contatos passivo numa **lista de tarefas
política priorizada por impacto de voto**. O vereador abre de manhã e sabe o que fazer.

---

## 3. PROVA DE TRABALHO AUTOMÁTICA

**O que faz:** quando uma demanda é resolvida, o cidadão é avisado automaticamente — com
crédito ao vereador.

**Lógica do gatilho:**
```
Quando Demanda muda para status RESOLVIDA:
  1. Verifica se há cidadão vinculado com contato (whatsapp/email)
  2. Monta mensagem com: o que foi pedido, o que foi feito, link da
     proposição/ofício (se materiaIdSapl existe), data
  3. Aguarda confirmação do assessor (não dispara sozinho sem revisão — evita gafe)
  4. Registra em ComunicacaoEnviada (para painel e histórico)
  5. Atualiza termômetro do cidadão para QUENTE
```

**Regra anti-gafe:** nunca dispara automático sem um humano confirmar — em política, uma
mensagem errada custa caro. A IA prepara, o humano aprova.

**O diferencial:** fecha o ciclo dor→solução→crédito. O cidadão sente que foi ouvido e
sabe quem resolveu. Marketing político que se alimenta do trabalho real.

---

## 4. DEMANDA → PROPOSIÇÃO (IA)

**O que faz:** transforma uma demanda informal em ato legislativo formatado.

**Lógica:**
```
Entrada: demanda ("falta iluminação na Rua X, bairro Y")
Processo IA:
  1. Classifica o tipo de ato cabível (indicação / requerimento / ofício)
     - pedido ao Executivo sobre serviço público → Indicação
     - pedido de informação → Requerimento
     - demanda que vira norma → minuta de PL
  2. Gera o texto no formato correto (LC 95/1998 para leis), com:
     - ementa, justificativa, fundamentação, endereço/localização
  3. Preenche dados do gabinete e autoria
  4. Apresenta como RASCUNHO para revisão humana
  5. Após aprovação → integra com escrita no SAPL (fase futura) ou exporta para protocolo
```

**Regra inegociável:** texto gerado é sempre rascunho. Revisão humana obrigatória antes de
protocolar. A IA acelera, não decide.

**O diferencial:** multiplica a produtividade legislativa visível. Vereador que produzia 10
proposições/ano produz 50, todas nascidas de demanda real (não de encheção).

---

## 5. CHAT DE CONSULTA (IA com fonte)

**O que faz:** pergunta em linguagem natural sobre demandas, território e legislativo.

**Lógica do roteador de intenção:**
```
Pergunta entra → classifica as partes:
  - parte TEMÁTICA ("sobre iluminação") → busca semântica (pgvector)
  - parte FILTRO ("resolvidas", "no bairro X", "esse ano") → query SQL estruturada
  - parte LEGISLATIVA ("virou indicação?") → consulta sapl_cache
Executa cada parte, cruza, responde com:
  - o número/resultado
  - a LISTA rastreável por trás (cada item com link)
```

**Exemplos que tem que responder:**
- "Quantas demandas de saúde resolvi no bairro Centro esse ano?"
- "Quais lideranças estão frias na minha região de voto forte?"
- "Que demandas viraram indicação e quais ainda não?"

**Regra inegociável:** responde só do que encontrou. Número sempre com lista por trás.
Nunca estima, nunca inventa. Se não achou, diz que não achou.

**O diferencial:** o gestor pergunta e o sistema responde com prova. É o que a Softplan
validou (Iris) — mas aplicado ao mandato do vereador.

---

## 6. ALERTA DE OPORTUNIDADE

**O que faz:** o sistema detecta padrões e sugere ação que o vereador não enxergou.

**Lógica (detecção de padrão):**
```
Roda periodicamente (job) procurando:
  - Cluster de demandas do mesmo tema na mesma região
    → "15 pedidos de iluminação no bairro Z — sugere indicação coletiva"
  - Tema recorrente sem nenhuma proposição do gabinete
    → "Você recebe muita demanda de saúde mas não propôs nada sobre — oportunidade"
  - Região de voto forte com demanda acumulada sem resolução
    → "Bairro W te elegeu e tem 8 demandas paradas — risco"
  - Bairro órfão (muita demanda, nenhum vereador atuando)
    → "Ninguém atua no bairro K — território político vago"
```

**O diferencial:** sai do reativo. O sistema **enxerga o que o volume esconde** e vira
conselheiro estratégico. Ninguém no mercado de câmara faz isso.

---

## 7. RADAR DO MANDATO — INTELIGÊNCIA DO MAPA

**O que faz:** mapa que orienta a próxima ação (não mostra o passado).

**Lógica das camadas e cores (cruzamento é o ouro):**
```
Para cada região/bairro/seção, calcula e pinta:

  VERMELHO (atenção) = teve voto forte + sem atuação recente
                       → base esfriando, risco de perder
  VERDE (crescendo)  = voto fraco + demandas sendo resolvidas
                       → conquistando território novo
  AZUL (oportunidade)= muita demanda + nenhum vereador atuando
                       → bairro órfão, entrar antes dos outros
  CINZA (estável)    = voto e atuação equilibrados

Score de prioridade por região =
  (peso eleitoral da região) × (demanda acumulada) ÷ (atuação recente)
  → ordena onde o vereador deve ir PRIMEIRO
```

**Modo preditivo (IA):**
```
- Sazonalidade: aprende padrão histórico ("bairro ribeirinho → demanda de
  enchente em out-nov") e marca a região ANTES do problema
- Tendência: região com demanda crescendo mês a mês → sinaliza emergente
```

**Mapa que conversa:** pergunta natural ("onde tenho voto mas não atuo?") redesenha o mapa
filtrando. Une chat (seção 5) com Radar.

**O diferencial:** GPS de verdade — dá a rota, não o retrovisor. Os concorrentes mostram
"onde estive"; o teu mostra "onde ir e por quê".

---

## 8. PAINEL DE DESEMPENHO DO MANDATO

**O que faz:** transforma trabalho diário em narrativa de campanha, automaticamente.

**Métricas calculadas:**
```
- Demandas atendidas no período (total e por tema)
- Taxa de resolução (resolvidas ÷ recebidas)
- Tempo médio de resolução
- Bairros alcançados (cobertura territorial)
- Proposições nascidas de demanda real (vínculo demanda→materiaIdSapl)
- Evolução mês a mês
- Comparativo de cobertura: regiões atendidas vs regiões de voto
```

**Saída:** exportável como material de prestação de contas / campanha (PDF).

**O diferencial:** na hora de prestar contas ou fazer campanha, o vereador aperta um botão
e tem a narrativa pronta, baseada em dado real. Não precisa "lembrar" o que fez.

---

## 9. ANÁLISE DE SENTIMENTO / TERMÔMETRO DA BASE

**O que faz:** sinaliza se a base de uma região está satisfeita ou irritada.

**Lógica:**
```
Cruza sinais:
  - Volume de demandas abertas vs resolvidas por região (acúmulo = insatisfação)
  - Tempo de resposta degradando
  - Tom das mensagens recebidas (NLP de sentimento, quando houver canal de texto)
  - Demandas reabertas (sinal de insatisfação com a "solução")
Gera índice de saúde da base por região + alerta de erosão precoce.
```

**Regra:** é sinal de alerta, não verdade absoluta — sempre com os dados que sustentam.

**O diferencial:** alerta precoce. O vereador descobre que está perdendo uma região
ANTES da eleição, não depois.

---

## 10. ASSISTENTE DE ESTRATÉGIA (IA)

**O que faz:** conselheiro de campanha permanente baseado nos dados.

**Lógica:**
```
Cruza: calendário eleitoral + Radar + termômetro + histórico de atuação
Gera recomendações como:
  "Faltam 8 meses para eleição. Suas regiões mais fracas são A, B, C.
   B te elegeu e está esfriando — prioridade. Sugiro: resolver as 5
   demandas paradas lá e agendar presença."
```

**Regra inegociável:** recomendação fundamentada nos dados, com o porquê explícito.
Nunca "ache" — sempre "com base em X, Y, Z".

**O diferencial:** é o que nenhum CRM tem — não organiza informação, **aconselha ação
política** com base em evidência.

---

## PRINCÍPIOS QUE ATRAVESSAM TUDO (a alma do produto)

1. **Decisão, não dado.** Cada funcionalidade não mostra informação — interpreta e sugere
   ação. CRM comum mostra; o teu orienta.
2. **Impacto de voto como bússola.** Toda priorização pergunta: isso ajuda a reeleger?
   Ordena por impacto político, não por ordem alfabética.
3. **IA rastreável e revisada.** Toda IA responde com fonte, gera rascunho, exige revisão
   humana em ato oficial. Confiança é o pilar de venda (validado: Softplan).
4. **Fecha o ciclo.** Dor do cidadão → ação legislativa → crédito comunicado → voto.
   Cada feature é um elo desse ciclo, não uma ilha.
5. **Enxerga o invisível.** O valor está em revelar o que o volume esconde — padrões,
   riscos, oportunidades que o vereador não vê sozinho.

---

## O que separa isto de um CRM comum (resumo)

| CRM comum | Este produto |
|---|---|
| Lista de contatos | Termômetro que prioriza por risco de voto |
| Registro de demandas | Demanda que vira proposição com IA |
| Mapa de onde estive | Radar de onde devo ir e por quê |
| Relatório de atividades | Narrativa de campanha automática |
| Busca por filtro | Chat que responde com prova |
| Você procura informação | O sistema te avisa da oportunidade |
| Dado | Decisão |
