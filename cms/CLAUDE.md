# CLAUDE.md — Portal Legislativo da Câmara de Lajeado/RS

Regras de condução do projeto. Ler antes de agir. Estas decisões valem até o
usuário (francistk@gmail.com) revogá-las explicitamente.

> **AO RETOMAR, LEIA PRIMEIRO `docs/07-estado-atual.md`** — handoff completo:
> arquitetura, o que está pronto, como rodar, decisões, armadilhas e pendências.
> Manter esse arquivo atualizado ao fim de cada sessão grande.

## Contexto do projeto
- Front novo em **Next.js + TS + Tailwind + shadcn**, **Payload CMS** dentro do mesmo Next,
  **SAPL** (Django) como fonte oficial de legislação/transparência. Banco PostgreSQL.
- O público **nunca** acessa SAPL nem CMS direto — tudo passa por cache/CDN (SSG/ISR).
- Documentação de planejamento vive em `./docs` e `README.md`. Está boa; não regredir dela.

## Como este projeto é gerenciado

### Regra 1 — Risco antes de processo
O gargalo do projeto NÃO é organização — é **risco técnico externo não validado**.
Não introduzir metodologia pesada de gestão (ex.: GSD/`.planning`, orquestração
multi-agente cerimoniosa) como espinha dorsal. É 1 dev, escopo já mapeado.
Gestão deliberadamente leve: backlog simples organizado pelas fases já existentes
em `docs/03-cronograma.md`.

**Política GSD (automática) — ler `docs/politica-gsd.md` antes de acionar qualquer skill
`gsd-*`, `.planning` ou orquestração multi-agente.** Default = NÃO usar. Vale pros dois
produtos (portal e CRM). GSD só à la carte: `gsd-spike` pra validar risco externo;
`gsd-plan-phase` só numa fase grande E nebulosa; `gsd-debug` em bug difícil. Na dúvida,
não usar e perguntar ao dev. Se eu estiver prestes a gerar artefato de processo que só eu
mesmo vou ler, parar — é sinal de overhead.

### Regra 2 — Validar a premissa crítica certa ANTES de codar produto
Fronteira esclarecida no spike (ver `docs/00-premissas-sapl.md`):
- **Transparência financeira NÃO é da Câmara** — é da Prefeitura, hospedada nos sistemas
  dela; o portal só **linka** para fora (varia por Câmara). NÃO há integração financeira a
  construir. Não perder tempo tentando engenharia-reversa de "como a transparência se
  conecta" — é curadoria de links + a parcela administrativa própria da Câmara.
- **SAPL é o motor do que é da Câmara**: matérias, tramitação, sessões, normas, protocolo.
  Confirmado por portais Interlegis reais (Plone+SAPL). O projeto troca a casca Plone por
  Next.js mantendo SAPL atrás.

A premissa a validar com EVIDÊNCIA (JSON real) é: **a API do SAPL entrega o núcleo
legislativo do jeito necessário** (paginação, campos, tramitação, sessões/pautas). É o
risco técnico real. Para a Fase 4, a ação é não-técnica: obter da Câmara-alvo a lista de
links/sistemas de transparência que ela já usa.

### Regra 3 — Spike primeiro (Fase 0 = verificação, zero código de produto)
Primeiro entregável real: subir SAPL em Docker, sondar a API, e produzir um documento
de premissas "confirmadas / quebradas / mitigação". Só depois: scaffold, design system, etc.

### Regra 4 — Checklist do TCE-RS versionado no repo
Manter um checklist no repositório: item → URL da página → fonte do dado → status.
É isso que protege a nota 100%, não um agente verificador. Tratar como requisito travado.

### Regra 5 — Auditoria pesada só onde o risco é real
Rodar auditorias robustas (acessibilidade WCAG/eMAG, segurança) pontualmente na
Fase 4/5, antes do go-live — não como ritual de toda fase.

## Economia de tokens (decisão registrada)
- **Não** instalar compressores de contexto tipo Headroom: miram aplicações-LLM com
  contexto pesado (RAG/logs); este portal não tem IA e a sessão não roteia por proxy.
  O custo de plugar supera a economia, e compressão com perda em JSON do SAPL vira bug.
- Economia de token aqui vem de **disciplina de sessão**, não de ferramenta:
  - Ler cirúrgico (trechos + busca, nunca despejar arquivos inteiros à toa).
  - Sessões focadas por tarefa; usar `/compact` quando o histórico esticar.
  - Modelo proporcional à tarefa (trabalho mecânico não precisa de Opus).

## Estrutura de código (monólito modular — pensar como ERP)
Sistema complexo: organizar por DOMÍNIO, não jogar tudo numa pasta. Componentes
reutilizáveis e DRY são regra, não exceção.

```
src/
  app/(frontend)   rotas finas — só orquestram (query + componentes), sem lógica de dados
  app/(payload)    admin gerado
  modules/         domínios de negócio (cada um dono do seu modelo + queries)
    core/          users, media
    noticias/  vereadores/  comissoes/  institucional/  banners/
    legislativo/   cliente e queries do SAPL
  components/
    layout/        shell (SiteHeader, SiteFooter)
    ui/            primitivos reutilizáveis (Icon, SectionHeader, *Card, RichTextContent)
  lib/             utilitários transversais (format, payload client, media)
```

Convenções:
- Collections do Payload: `modules/<dominio>/<dominio>.collection.ts`, agregadas em
  `modules/index.ts` (barrel) e consumidas só por `payload.config.ts`.
- Acesso a dados: `modules/<dominio>/<dominio>.queries.ts` (nunca chamar `getPayload`
  solto na página — usar `lib/payload.ts` → `getPayloadClient()`).
- Tipos do Payload têm nomes auto-gerados feios (`Vereadore`, `Comissoe`): expor
  **alias de domínio** no módulo (`export type Vereador = Vereadore`).
- Antes de criar componente novo, checar se já existe um reutilizável em `components/ui`.
- Páginas não repetem markup: usar os componentes de `ui/`.

## Regra de migração de dados (NUNCA hardcoded)

Todo dado que vai para o portal tem um destino certo. Nunca hardcodar em código.

| Domínio | Destino | Exemplos |
|---|---|---|
| Processo legislativo | **SAPL** | Vereadores, comissões, mesa diretora, sessões, matérias, votações, normas, tramitação |
| Conteúdo editorial | **Payload CMS** | Notícias, páginas institucionais, banners, FAQ, ouvidoria |
| Identidade da câmara | **Payload CMS** (Global Configurações) | Nome, contato, redes sociais, logo, links de transparência, textos da home |

**Regra absoluta:** ao encontrar dado hardcoded em página, componente ou arquivo de configuração:
1. Identificar se é domínio SAPL ou Payload
2. Migrar para o sistema correto
3. Apagar o hardcode

Nunca criar collection no Payload para dados que pertencem ao SAPL (parlamentares, comissões, sessões, etc.). Nunca criar fallback estático em código para dados que deveriam vir de banco.

## Layout de páginas (regras travadas — nunca regredir)

### Toda página de conteúdo usa `ArtigoLayout`
**TODAS** as páginas de detalhe/conteúdo longo usam o componente `ArtigoLayout`
(`src/components/ui/ArtigoLayout.tsx`). Nunca usar `<article className="prosa">` diretamente
nas páginas — o componente é o único ponto de controle do shell visual.

Páginas de listagem/grid (home, vereadores, sessões, notícias index…) NÃO usam ArtigoLayout.

### Centralização: só notícia individual
O `ArtigoLayout` por padrão é **alinhado à esquerda** dentro do container da página.
A **única exceção** é a notícia individual (`/noticias/[slug]`), que passa `centralizar`
para centralizar a coluna de leitura:

```tsx
<ArtigoLayout centralizar ...>  // ← só em noticias/[slug]/page.tsx
```

**Nunca** adicionar `margin: 0 auto` ao `.artigo` no CSS global — isso quebraria o alinhamento
de todas as outras páginas. A centralização é opt-in por página via prop.

### Foto em todo parlamentar
Todo lugar que exibe um parlamentar (vereador, membro de mesa, comissão, votação, orador)
**deve** mostrar a foto. Usar o componente `ParlamentarAvatar` (`src/components/ui/ParlamentarAvatar.tsx`):
- `size="sm"` (40px) — listas e tabelas
- `size="md"` (62px) — cards compactos
- `size="lg"` (96px) — cards padrão

As queries que retornam parlamentares **devem** incluir `fotoUrl: string | null` no tipo.
Usar `urlDocumento(p.fotografia)` para converter o campo do SAPL.

## Conformidade legal (requisitos travados — não regridem)
LAI (12.527/2011), LC 131/2009, checklist TCE-RS (nota 100% atual), acessibilidade
(LBI 13.146/2015 — eMAG/WCAG, desde o início), LGPD (banner + política, hospedagem nacional).
Legislação e transparência vêm do SAPL; conteúdo editorial vem do Payload. Não misturar.
