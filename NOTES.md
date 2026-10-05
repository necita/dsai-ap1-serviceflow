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
- SF-006 validada em 2026-10-05.

## SF-007 — Validação compartilhada e erros

- Adicionada validação runtime com Zod para nomes, e-mail normalizado, perfis/setores, setores, categorias, serviços e abertura de solicitações.
- `validateInput` aplica os schemas no servidor e converte falhas em erro de validação tipado; schemas estritos recusam campos desconhecidos, inclusive dados protegidos enviados pelo cliente.
- Erros de validação, autenticação, autorização, inexistência, conflito e falha inesperada possuem respostas com status/códigos estáveis. Mensagens são fixas; serialização não inclui stack, mensagem original, causa ou valores submetidos; caminhos/códigos de validação são filtrados.
- Testes unitários em `tests/unit/shared/validation/` e `tests/unit/server/errors/`; `npm run test:unit`, `npm run typecheck` e `npm run lint` aprovados.
- SF-007 concluída em 2026-10-05. SF-008 e tarefas posteriores não foram iniciadas.

## SF-008 — Autenticação e sessões

- Autenticação local com Auth.js Credentials e estratégia JWT; somente email/senha são aceitos e campos adicionais (incluindo perfil/setor) são recusados.
- Senhas são verificadas com Argon2id; apenas usuários ativos autenticam. O token/sessão são atualizados consultando o usuário atual no PostgreSQL; conta desativada tem os claims de identidade removidos e recebe sessão sem usuário.
- Cookies de sessão `HttpOnly`, `SameSite=Lax`, `Secure` em produção; validade máxima de oito horas. `AUTH_SECRET` permanece fora do repositório e deve ser configurado separadamente por ambiente.
- A autenticação executada em testes injeta explicitamente o Prisma Client da base física `serviceflow_test`; não usa o singleton de desenvolvimento.
- Login, logout e rotas Auth.js compilam; o controle de autorização server-side central será implementado somente em SF-010, conforme dependências.
- Validações: 25 testes unitários, quatro testes de integração de autenticação/sessão, `npm run typecheck`, `npm run lint` e `npm run build` aprovados em 2026-10-05.
- SF-008 concluída. SF-009 ainda não iniciada.

## SF-009 — Bootstrap do primeiro administrador

- `npm run bootstrap:admin` é um comando manual e interativo, não um seed; coleta nome/e-mail e lê a senha e confirmação em modo terminal sem eco, sem argumentos ou variáveis de ambiente para a senha.
- O comando carrega variáveis pelos mecanismos do Next.js, instancia Prisma sem logging de queries, recusa banco com sufixo `_test` e não exibe entradas nem detalhes de erro de banco.
- `bootstrapFirstAdmin` valida input estritamente, armazena somente hash Argon2id e limita a um administrador. Uma transação serializável, com rechecagem e tratamento do conflito serializável, fecha a janela de corrida entre tentativas concorrentes.
- A operação retorna apenas id/nome/e-mail e não imprime senha/hash. Ausência de administrador ou banco de teste foi validada no PostgreSQL isolado `serviceflow_test`; nenhuma conta foi criada em banco de desenvolvimento/produção.
- Teste unitário garante que mensagens do CLI são fixas e não ecoam erros inesperados ou credenciais; teste de integração verifica hash persistido e que o resultado não contém o hash.
- `@next/env` e `tsx` são dependências diretas para carregar a configuração padrão do Next e executar o CLI TypeScript em Node suportado pelo projeto.
- Validações do bloco final: 13 testes de integração totais, 35 unitários (incluindo CLI), recusa do CLI para banco `_test`, `npm run typecheck`, `npm run lint` e `npm run build` aprovados em 2026-10-05.
- SF-009 concluída. SF-010 está desbloqueada e ainda não iniciada.

## SF-010 — Autorização central no servidor

- `src/server/authorization/` separa políticas puras da obtenção do ator pela sessão atual do servidor (`getCurrentUser`); operações protegidas devem usar os wrappers `require*`, nunca identidade/perfil/setor da requisição cliente. Wrappers de solicitação recebem somente o ID e consultam propriedade/setor persistidos no Prisma antes de decidir.
- Configuração administrativa exige `ADMIN`; catálogo e criação exigem `REQUESTER`; solicitante lê somente recurso próprio; atendente lê e muda status somente quando o `Request.sectorId` persistido corresponde ao setor atual. Administrador não recebe acesso operacional implícito.
- Usuário não autenticado/inativo recebe erro de autenticação; recursos alheios ou operação operacional proibida são tratados como `NOT_FOUND` para não revelar sua existência. IDs de ator/setor retornados para transição vêm da sessão, não de entrada cliente.
- Testes unitários cobrem matriz de perfis, sessão e escopos; integração usa usuários/setores/solicitações persistidos no PostgreSQL de teste, incluindo mudança do setor atual do atendente.
- Verificações finais do bloco: 35 testes unitários, 13 testes de integração, `npm run typecheck`, `npm run lint` e `npm run build` aprovados em 2026-10-05.
- SF-010 concluída. SF-011 e posteriores não iniciadas.
