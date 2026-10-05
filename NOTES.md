## SF-001 — Scaffold

- Stack inicial: Next.js 16.3.8, React 19.2.8 e TypeScript 5.
- Runtime verificado: Node.js 24.21.0 e npm 11.19.0; o pacote declara Node.js >=20.9.0, requisito mínimo do Next.js selecionado.
- Gerenciador: npm, com lockfile versionado.
- App Router usa `src/` e alias `@/*`; ESLint usa a configuração oficial do Next.js.
- Esta etapa não configura banco, autenticação nem módulos de negócio; esses itens pertencem a tarefas posteriores.

## SF-005 — Migrations

- Em 2026-10-05, a migration inicial falhou porque as tabelas usavam `CITEXT` antes de a extensão PostgreSQL `citext` estar instalada.
- A migration `20261005141624_init` agora executa `CREATE EXTENSION IF NOT EXISTS citext;` antes de criar tipos ou tabelas.
- Antes da recuperação, a inspeção confirmou que a falha não havia criado tabelas nem tipos da aplicação no schema `public`; a migration falha era o único registro de migration.
- A migration foi marcada como rolled back pelo Prisma e reaplicada ao banco Supabase configurado. Nenhuma tabela ou dado existente foi apagado.
- Validações: `prisma validate`; `prisma migrate deploy`; `prisma migrate status`; verificação da extensão, seis tabelas, três colunas `citext` e oito chaves estrangeiras. O status final reportou o schema atualizado.
- SF-006 e tarefas posteriores não foram iniciadas.
