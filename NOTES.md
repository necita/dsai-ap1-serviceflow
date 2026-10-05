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

## SF-006 — Infraestrutura de testes

- Adicionados Vitest e Playwright como dependências de desenvolvimento, com comandos e configurações separados para unitários, integração PostgreSQL e E2E.
- O banco `serviceflow_test` foi criado no PostgreSQL acessível via Supabase. É uma base física separada do banco de desenvolvimento, não um schema compartilhado.
- `TEST_DATABASE_URL` fica em `.env.test.local` (ignorado pelo Git) e não é usada como fallback para `DATABASE_URL`. A configuração de integração exige um nome de banco terminado em `_test`, compara host/base com o banco de desenvolvimento, verifica conexão e aplica migrations antes da suite.
- Fixtures de integração limpam somente o banco isolado antes de cada teste e seguem a ordem de dependências das chaves estrangeiras; o runner limita a execução a um worker.
- Playwright usa Chromium para um smoke de inicialização sem testar funcionalidades do produto.
- A auditoria npm após a instalação reporta nove vulnerabilidades altas em pacotes que já existiam no lockfile anterior; nenhuma versão preexistente foi atualizada. A versão de Vitest adicionada foi elevada à primeira linha corrigida disponível, eliminando o alerta crítico encontrado durante a configuração.
- SF-006 validada em 2026-10-05. SF-007 e tarefas posteriores não foram iniciadas.
