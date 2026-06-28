# CLAUDE.md — CRM Legislativo (Plataforma de Inteligência Política)

> **LEIA `docs/ESTADO-ATUAL.md` PRIMEIRO** — handoff completo (estado, como rodar,
> decisões, armadilhas, próximos passos). Mantenha-o atualizado ao fim de cada sessão grande.

## Contexto
CRM SaaS multi-tenant (**Câmara → Gabinete**), produto à parte do site público (que vive em
`../cms`). Dados do CRM **isolados por gabinete**. Município de validação: Taquari/RS.
Stack: Next 15 + Prisma + Postgres(pgvector) + Auth.js v5 + BullMQ/Redis + Tailwind + Leaflet.

## Como rodar
`pnpm db:up && pnpm db:push && pnpm db:seed`, depois `pnpm dev` (:3100) e `pnpm worker`.
Login demo: `vereador.a@taquari.rs` / `demo1234`. Portas em `../PORTAS.md`.

## Regras travadas
- **Isolamento é sagrado**: todo acesso a dados de CRM passa por `withTenant(session.tenant, fn)`
  (ler/escrever via `src/modules/<dominio>/*.queries|actions.ts`, nunca `prisma` solto na página).
  Jobs globais (cutuca/aniversário) rodam em contexto admin de propósito. Raw queries filtram à mão.
- **Organização por domínio**: `app/` rotas finas; `modules/<dominio>/`; `lib/` transversal; `components/`.
- **Nova feature de dados → escreva um PoC** (`scripts/poc-*.ts`, padrão dos existentes) provando isolamento.
- **Processo leve (GSD)**: seguir `../cms/docs/politica-gsd.md`. Default = não usar GSD; só à la carte.

## Armadilhas (ver §10 do handoff)
- Após `db push`: reiniciar `pnpm dev` **e** `pnpm worker` (Prisma Client).
- Nunca mover `node_modules` do pnpm — apagar e `pnpm install`.
- PoCs limpam o banco — rodar `pnpm db:seed` depois.
- IDs do seed são fixos (`camara-taquari`, `gab-a`, `gab-b`); FK em camaraId = sessão velha → re-login.

## Estado
Fase 0 (Fundação) e Fase 1 (CRM núcleo) **completas**. Próximo: Fase 2 (Radar/TSE) ou Fase 3 (IA).
Envio real de comunicação ainda é stub (`modules/crm/comunicacoes.worker-core.ts`).
