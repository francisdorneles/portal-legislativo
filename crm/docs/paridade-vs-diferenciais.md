# Paridade vs. Diferenciais — onde empato o jogo, onde ganho o jogo

> Cruza a régua de paridade do concorrente mais completo (**Città / EProcLeg**, módulo Gabinete —
> fonte: edital real da Câmara de Ijuí, §3.4) contra **o que já está construído** neste CRM, e
> separa a camada de **diferenciais** (inteligência política que nenhum concorrente tem).
>
> Concorrentes mapeados (2026-06-25):
> - **Città/EProcLeg** — o mais completo em gabinete; régua de paridade. Mas **reativo** (registra o passado).
> - **Legisoft/Virtualiza** — foco em documento/processo; raso em CRM/relacionamento.
> - **Softplan** — NÃO faz CRM de gabinete; entrou como referência de "como se vende IA no setor público".

## 1. Régua de paridade (lista da Città) × nosso estado

Legenda: ✅ feito · 🟡 parcial · ⬜ gap

| # | Item da Città (paridade) | Nosso estado | Nota |
|---|---|---|---|
| 1 | Controle de documentos (ofícios/convites/cartas) + Google Docs | 🟡 | Temos documentos + mala direta + view de impressão; **sem** Google Docs |
| 2 | Registro de respostas/confirmação de recebimento (status+prazo) | 🟡 | `ComunicacaoEnviada.enviadaEm`; **read/entregue** vem com webhook Zernio (a plugar) |
| 3 | Numeração + textos-modelo com parâmetros substituíveis | 🟡 | Mala direta com `{nome}`; **falta numeração** de documentos |
| 4 | Relatórios gerenciais | 🟡 | Dashboard/cards + prestação por bairro; falta relatório gerencial formal |
| 5 | Mala direta + **etiquetas de endereço** | 🟡 | Mala direta ✅; **etiquetas** ⬜ |
| 6 | Cadastro de cidadãos por gabinete, com tags de perfil | ✅ | CRUD completo, tags, isolado por gabinete |
| 7 | Mapa p/ localização do endereço do cidadão | ✅ | Leaflet/OSM (equivalente, sem chave Google) |
| 8 | Aniversários + aviso da semana | ✅ | Cron diário 07:00 + alerta |
| 9 | Demandas com status e providências | ✅ | + histórico (`MovimentacaoDemanda`, transação) |
| 10 | Demanda com marcador no mapa + status | ✅ | Leaflet, picker por clique |
| 11 | **Integração Facebook** (postagem automática/agendada) | ⬜ | Gap — não temos |
| 12 | Envio automático de **e-mail** (documentos/aniversários) | ⬜ | Seam pronto; canal EMAIL é no-op (plugar Resend) |
| 13 | Abrir WhatsApp Web pelo telefone do cadastro | ✅ | Link wa.me na lista |
| 14 | **Integração Google Calendar** (agenda por gabinete) | ⬜ | Gap — não temos agenda |
| 15 | Envio de **SMS** por filtro | 🟡 | Disparo segmentado existe (enfileira); canal SMS é no-op |
| 16 | Acesso smartphone/tablet | ✅ | Web responsiva |

**Placar de paridade:** ✅ 7 · 🟡 5 · ⬜ 3 (de 16). Já cobrimos o núcleo; o que falta é
**integração externa** (Facebook, Google Calendar, e-mail/SMS reais) e **acabamento** (etiquetas,
numeração, Google Docs, relatório gerencial).

## 2. Gaps de paridade — esforço pra fechar (priorização)

| Gap | Esforço | Valor | Observação |
|---|---|---|---|
| E-mail real (canal EMAIL) | **baixo** | alto | Seam já existe → plugar Resend. Fecha #2/#12 de uma vez |
| SMS real (canal SMS) | baixo | médio | Mesmo seam; provedor SMS por env |
| Etiquetas de endereço | baixo | médio | Reusa view de impressão (CSS de etiqueta) |
| Numeração de documentos | baixo | baixo | Campo sequencial por gabinete |
| Relatório gerencial | médio | médio | Agrega o que já temos (demandas/temas/bairro) |
| Google Calendar (agenda) | médio | médio | Feature nova (agenda por gabinete) + OAuth Google |
| Google Docs | médio | baixo | Integração; nossa view de impressão já cobre o essencial |
| Facebook (post automático) | médio | médio | Meta Graph API; atenção a políticas |

## 3. Camada de diferenciais — onde NINGUÉM está (já construído)

Nenhum concorrente (Città incluída) tem nada disto — é "registrar o passado" vs. "decidir o futuro":

| Diferencial | Estado | O que faz |
|---|---|---|
| Termômetro de relacionamento | ✅ | Interpreta recência/vínculo → quente/esfriando/frio/risco |
| Cutuca (agenda de relacionamento) | ✅ | Lista de tarefas priorizada por impacto de voto |
| Radar do Mandato (voto por bairro) | ✅ | TSE real, polígonos IBGE, ranking voto×demanda |
| Mapa de Disputa (meu × rival) | ✅ | Bairro meu/disputa/rival por candidato TSE |
| Insight de oportunidade | ✅ | "Muito voto, pouca demanda" → onde agir |
| Prova de trabalho automática | ✅ | Demanda resolvida → avisa o cidadão (seam de envio) |
| Prestação de contas por bairro | ✅ | "Seu vereador trabalhou aqui" (WhatsApp/PDF) |
| Copiloto estratégico | ✅ | Agenda de rua da semana priorizada por IA |
| Agente Investigador (IA agêntica) | ✅ | Pergunta natural → dossiê cruzando fontes do gabinete |
| Chat com fonte rastreável | ✅ | Responde só com dados do gabinete, citando fonte |
| Captura voz/foto (Whisper+Visão) | ✅ | Áudio/foto da rua → demanda estruturada |
| Demanda → proposição por IA | ✅ | Minuta de Indicação/Requerimento em PT legislativo |
| Vigia do Diário Oficial | ✅ | Cruza diário × bairros/nome do vereador → alertas |

## 4. Conclusão estratégica

- **Empato o jogo** fechando 3 gaps reais (Facebook, Google Calendar) + acabamento — a maioria é
  integração de baixo esforço, e o **e-mail/SMS real sai quase de graça** porque o *seam de envio*
  já está pronto (mesma peça do WhatsApp/Zernio).
- **Ganho o jogo** na camada de inteligência, que **já está construída** e nenhum concorrente tem.
  O risco competitivo NÃO é falta de diferencial — é faltar uma caixinha de paridade que o
  comprador usa de checklist no edital. Por isso esta lista importa: é o checklist do edital.
- **Ordem sugerida:** (1) e-mail real [destrava #2/#12, baixo esforço], (2) etiquetas + numeração
  [acabamento barato], (3) SMS real, (4) relatório gerencial, (5) Google Calendar, (6) Facebook.

> Próximo refinamento: análise feature-a-feature + pricing de cada concorrente (hoje a lista da
> Città vem de edital; Legisoft/Softplan de site). Ver `docs/analise-competitiva.md`.
