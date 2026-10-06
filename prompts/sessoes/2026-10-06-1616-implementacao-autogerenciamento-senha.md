# Sessão SF-029 — Implementação do autogerenciamento da senha — 2026-10-06

## Solicitação

Implementar a alteração própria de senha aprovada na seção 20 da SPEC para `ADMIN`, `REQUESTER` e `ATTENDANT`. Exigir senha atual, nova senha de pelo menos 12 caracteres e confirmação idêntica; usar somente identidade da sessão, verificação e hash Argon2id existentes; não aceitar `userId`; manter a sessão e exibir feedback; sem recuperação de senha, schema/banco adicional, commit ou push. Executar unitários, integração, typecheck, lint e build.

## Resultado

- Implementada operação de domínio protegida pela sessão ativa, validação estrita e update condicional do hash; página `/account/password`, ação server-side, formulário, navegação para os três perfis e feedback sanitizado.
- Testes unitários incluem schema, rejeição de `userId`, mensagens seguras e validação; testes de integração reais foram adicionados para os três perfis, tentativas inválidas, persistência de hash, sessão e login subsequente.
- `npm.cmd run test:unit`: 79 aprovados; typecheck, lint e build aprovados.
- `npm.cmd run test:integration` não iniciou devido a `EPERM` no rename do engine Prisma durante geração do client. Executar Vitest diretamente também falhou no global setup por conexão indisponível ao `TEST_DATABASE_URL`. Integração permanece não validada e SF-029 não está concluída.
- Não houve alteração de schema/banco, implementação de recuperação, commit ou push.
