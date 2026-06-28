# Portal Legislativo — Câmara de Vereadores de Lajeado/RS

Portal web da Câmara de Vereadores de Lajeado/RS, desenvolvido do zero no front-end,
reaproveitando o SAPL (Interlegis/Senado) como motor do **processo legislativo**.
(A transparência financeira é da Prefeitura e entra por link externo — ver docs/00.)

## Status
- Fase atual: **Fase 3 (Núcleo legislativo) — a iniciar**
- Fase 0 ✅: SAPL validado (OpenAPI, 280 rotas), arquitetura confirmada, premissa de
  transparência corrigida — ver [docs/00](docs/00-premissas-sapl.md)
- Fase 1 ✅: camada de dados — clientes tipados (SAPL + Payload), cache/ISR
- Fase 2 ✅: portal público no **Layout 3**; collections editoriais (Notícias, Vereadores,
  Comissões, Páginas, Banners); home com busca legislativa + serviços + notícias +
  transparência; páginas públicas e stubs (sem 404)
- Próximo (Fase 3): processo legislativo, busca em leis e sessões — com dados reais do SAPL
- Site de referência: https://lajeado.rs.leg.br (nota 100% no checklist do TCE-RS)

## Rodar localmente
```
docker compose -f spike/docker-compose.yml up -d      # SAPL (porta 8010)
docker compose -f docker-compose.dev.yml up -d         # Postgres do Payload (porta 5433)
pnpm install
pnpm dev                                                # Next + Payload
```
- Front/admin: http://localhost:3000 (admin do Payload em `/admin`)
- Teste de conexão com o SAPL: `/sapl-test`
- Regenerar tipos do SAPL: `pnpm generate:sapl-types`

## Documentos
- [Premissas SAPL/TCE (spike Fase 0)](docs/00-premissas-sapl.md)
- [Decisões de arquitetura](docs/01-decisoes-arquitetura.md)
- [Stack tecnológico](docs/02-stack.md)
- [Cronograma por fase](docs/03-cronograma.md)
- [Mapa de páginas e responsabilidades](docs/04-mapa-paginas.md)
- [Conformidade legal (TCE-RS, LAI, LGPD, acessibilidade)](docs/05-conformidade.md)
- [Glossário](docs/06-glossario.md)
- [Estratégia de cache/ISR](docs/07-cache-isr.md)

## Resumo em uma frase
Front-end novo em **Next.js + TypeScript**, com **Payload CMS** (mesmo projeto) para o
conteúdo editorial da Ascom, e o **SAPL** por trás como fonte oficial de dados
legislativos e de transparência. Banco **PostgreSQL**. Tudo passa por cache/CDN —
o público nunca acessa o SAPL ou o CMS diretamente.
