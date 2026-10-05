# ServiceFlow

Plataforma configurável para gerenciamento de solicitações de serviços internos.

## Requisitos

- Node.js 24.21.0 (mínimo suportado pelo Next.js: 20.9.0).
- npm 11.19.0.

Essas versões foram verificadas durante a inicialização do scaffold.

## Desenvolvimento

Instale as dependências e inicie o servidor:

```bash
npm install
npm run dev
```

A aplicação fica disponível em <http://localhost:3000>.

## Variáveis de ambiente

Este projeto usa variáveis de ambiente para configurar a conexão com o PostgreSQL local. Crie uma cópia do arquivo de exemplo e ajuste os valores locais sem versionar segredos reais:

```bash
cp .env.example .env.local
```

Conteúdo esperado no arquivo local:

```env
NODE_ENV=development
DATABASE_URL=postgresql://serviceflow:change-me@localhost:5432/serviceflow_dev
```

- O arquivo `.env` real deve permanecer fora do Git.
- A URL do banco deve usar o protocolo `postgresql://` ou `postgres://`.
- O banco deve ser criado previamente em uma instância local do PostgreSQL e o nome do schema/database deve refletir o ambiente escolhido.
- Gere `AUTH_SECRET` localmente com `node -e "console.log(require('node:crypto').randomBytes(32).toString('base64'))"` e mantenha o valor somente no arquivo de ambiente ignorado pelo Git. Use um valor independente e protegido para cada ambiente.

## Autenticação

A autenticação usa Auth.js com credenciais locais e sessões JWT em cookie `HttpOnly`, `SameSite=Lax` e `Secure` em produção. Senhas são verificadas com Argon2id. A callback de sessão consulta o usuário atual no PostgreSQL a cada leitura, atualiza perfil/setor e descarta sessões de contas inativas; os helpers em `src/server/authorization/` aplicam as permissões server-side sem confiar em perfil ou setor enviados pelo cliente. Não há cadastro público nem credencial padrão; o primeiro administrador é provisionado manualmente pelo procedimento seguro de bootstrap abaixo.

### Primeiro administrador

Com `DATABASE_URL` configurada no ambiente local (`.env.local` ou outro arquivo reconhecido pelo Next.js), execute `npm run bootstrap:admin` uma única vez em um terminal interativo. O comando pergunta nome e e-mail e solicita a senha duas vezes sem ecoá-la; não aceita credenciais por argumentos nem variáveis de ambiente. Ele recusa a operação se já houver qualquer administrador, armazena somente o hash Argon2id e não funciona como seed recorrente. Não execute o bootstrap apontando para o banco de testes.

## PostgreSQL local

Para o ambiente local de desenvolvimento, configure uma instância PostgreSQL e crie o banco indicado na variável `DATABASE_URL`.

Exemplo de criação local:

```bash
createdb serviceflow_dev
```

Em seguida, ajuste o valor de `DATABASE_URL` no arquivo de ambiente local para refletir a porta, usuário e nome do banco em uso.

## Prisma

O projeto usa Prisma para gerenciar a integração com PostgreSQL. A configuração inicial inclui o datasource PostgreSQL e o cliente gerado pelo Prisma.

Comandos de manutenção:

```bash
npx prisma validate
npx prisma generate
npx prisma migrate dev
npx prisma migrate deploy
```

O Prisma Client fica em um módulo server-side dedicado e não deve ser importado diretamente por componentes cliente.

## Testes

As suites são separadas:

```bash
npm run test:unit
npm run test:integration
npm run test:e2e
```

Os testes de integração exigem um banco PostgreSQL **dedicado** cujo nome termine em `_test`. Não use o banco de desenvolvimento ou produção. Em um PostgreSQL com permissão para criar bancos, crie `serviceflow_test` (por exemplo, `createdb serviceflow_test`). Para Supabase, use uma base de teste separada no projeto; não use apenas outro schema no banco de desenvolvimento.

Copie `.env.test.example` para `.env.test.local` e configure `TEST_DATABASE_URL` com a URL do banco de teste:

```powershell
Copy-Item .env.test.example .env.test.local
```

O arquivo `.env.test.local` é ignorado pelo Git. A URL é carregada somente pela configuração de integração; o runner recusa a URL se ela aponta para o mesmo host e banco que `DATABASE_URL`, e nunca usa `DATABASE_URL` como fallback. `npm run test:integration` gera o Prisma Client, verifica a conexão e executa `prisma migrate deploy` exclusivamente contra `TEST_DATABASE_URL`. Os fixtures de integração são limpos antes de cada teste, em ordem compatível com as chaves estrangeiras; mantenha essa base exclusiva para um processo/job de teste por vez.

Instale o Chromium do Playwright uma vez por máquina:

```bash
npm exec -- playwright install chromium
```

O smoke E2E valida somente a inicialização do Playwright e do navegador; os fluxos do produto serão cobertos em tarefas posteriores.

## Verificações

```bash
npm run typecheck
npm run lint
npm run build
```

Para servir a versão compilada, execute `npm run start` após o build.

O scaffold atual contém a estrutura inicial do Next.js, o schema PostgreSQL/Prisma e a infraestrutura de testes. As funcionalidades do produto serão adicionadas conforme as tarefas aprovadas em `TASKS.md`.
