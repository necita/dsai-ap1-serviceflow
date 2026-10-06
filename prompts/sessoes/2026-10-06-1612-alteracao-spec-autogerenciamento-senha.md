# Sessão — Alteração de SPEC: autogerenciamento da própria senha — 2026-10-06

## Solicitação

Registrar antes de qualquer implementação uma nova regra aprovada para usuários autenticados `REQUESTER` e `ATTENDANT` alterarem a própria senha; permitir o mesmo a `ADMIN` somente para a própria conta. O servidor deve usar exclusivamente a sessão para identificar o usuário, verificar a senha atual, validar senha nova e confirmação, persistir somente hash pela camada segura existente e não aceitar `userId` do cliente. Não incluir recuperação/redefinição por terceiro. Não implementar nesta etapa nem alterar banco/schema sem necessidade.

## Resultado

- Atualizada `SPEC/2026-09-30-catalogo-e-solicitacoes.md`: seções 3 (atores), 4 (escopo), 7 (regra de negócio), 15 (critérios de aceitação), 16 (testes), 19 (fora de escopo) e nova seção 20 com alteração datada de 2026-10-06.
- A SPEC não possuía política além de senha não vazia nos fluxos existentes; definida política mínima para esta nova capacidade: nova senha de no mínimo 12 caracteres e confirmação idêntica, sem alterar retroativamente os fluxos existentes.
- Atualizados `NOTES.md` e `diario/2026-10-06.md` para registrar a decisão e o estado pendente de implementação.
- Nenhum código ou esquema foi alterado; não houve commit ou push.
