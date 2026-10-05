# Sessão SF-026 — Correções de lacunas da SPEC — 2026-10-05

## Prompt

> Implementar somente quatro lacunas reais dentro da SPEC aprovada: índices para consultas Request por requester/sector; restrição PostgreSQL entre perfil e setor; teste de atendimento após desativar serviço; teste de conclusão por outro atendente do mesmo setor. Não modificar a SPEC, não criar funcionalidades futuras nem código artificial, executar testes focados e suites completas, typecheck, lint, build e validação Prisma/migrations. Revisar o diff e não fazer commit/push.

## Implementação

- Adicionados `@@index([requesterId])` e `@@index([sectorId])` ao modelo Request e nova migration SQL com esses índices.
- Criada restrição `User_role_sectorId_check` no PostgreSQL. Mantidas validações existentes na aplicação.
- Adicionados testes de integração para constraint/índices, atendimento de solicitação existente após desativação do serviço e conclusão por um segundo atendente ativo do mesmo setor.
- Corrigido fixture de teste legado que persistia atendente sem setor.

## Validação

- Testes focados de integração: 9 aprovados.
- `npm run test:unit`: 73 aprovados.
- `npm run test:integration`: 61 aprovados em `serviceflow_test`.
- `npm run test:e2e`: 1 cenário aprovado.
- `npm run typecheck`, `npm run lint`, `npm run build`, `npx prisma validate` e `npx prisma migrate status` no banco isolado: aprovados.
- Migration aplicada somente a `serviceflow_test`; SPEC inalterada, SF-026 continua incompleta e nenhum commit/push realizado.
