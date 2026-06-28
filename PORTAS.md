# Registro de portas — apps da pasta-mãe

> Fonte única de verdade pra evitar colisão entre apps. Antes de subir/criar app novo,
> reserve aqui uma faixa livre. Cada app PINA sua porta no `package.json` (não usar default).

## Mapa atual

| App            | Pasta   | Web (Next) | Postgres | Redis | Observações                         |
|----------------|---------|-----------:|---------:|------:|-------------------------------------|
| **cms** (site) | `cms/`  | **3003**   | 5433     | —     | portal público (Next + Payload + SAPL) |
| **crm**        | `crm/`  | **3100**   | 5434     | 6380  | CRM / Inteligência Política         |

## Convenção (pra crescer sem bagunça)

- **Web (Next):** cada app reserva uma faixa de 100 — cms=3000–3099 (usa 3003),
  crm=3100–3199, próximo app=3200–3299, e assim por diante.
- **Postgres:** 543X incremental por app (cms=5433, crm=5434, próximo=5435…).
- **Redis:** 638X incremental (crm=6380, próximo=6381…).
- A porta fica **pinada no `package.json`** do app (`next dev -p <porta>`, `next start -p <porta>`)
  e no `docker-compose.dev.yml` (mapeamento de portas), nunca no default.

## Regra de ouro
Subiu app e deu "address already in use"? NÃO suba em porta aleatória — consulte esta tabela,
pegue a faixa do app certo, ou reserve uma nova faixa aqui.
