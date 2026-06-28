# CRM Legislativo — Plataforma de Inteligência Política

Produto **à parte** do portal público de transparência. SaaS multi-tenant
(Câmara → Gabinete) para gestão de mandato: CRM, Radar do Mandato e IA.

Estrutura: este CRM vive em `<pasta-mãe>/crm`; o site da câmara em `<pasta-mãe>/cms`.

- Arquitetura: `./docs/Arquitetura-CRM-Radar-IA.md`
- Premissas validadas: `./docs/00-premissas-crm.md`
- Inteligência de produto: `./docs/Inteligencia-Produto-CRM.md`
- Política de processo (GSD): `../cms/docs/politica-gsd.md`

## Estado (Fase 0 — Fundação)

Espinha mínima para **provar o risco #3 (isolamento multi-tenant)** antes de construir
features. Stack alvo: Next.js + Prisma + Postgres(pgvector) + Auth.js + BullMQ/Redis.
Por enquanto: Prisma + tenancy + extensão de isolamento + PoC.

## Rodar o PoC de isolamento

```bash
pnpm install
pnpm db:up          # sobe Postgres(pgvector) + Redis (portas 5434 / 6380)
cp .env.example .env
pnpm db:push        # cria as tabelas
pnpm poc:isolamento # roda o teste do risco #3
```

O PoC prova: create grava o gabinete certo; um gabinete não lê/edita dado de outro;
admin (sem contexto) enxerga tudo. Lógica em `src/lib/prisma.ts` + `src/lib/tenant-context.ts`.
