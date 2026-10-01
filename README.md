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

## Verificações

```bash
npm run typecheck
npm run lint
npm run build
```

Para servir a versão compilada, execute `npm run start` após o build.

O scaffold atual contém somente a estrutura inicial do Next.js e a configuração de ambiente para PostgreSQL. Banco de dados e funcionalidades do produto serão adicionados conforme as tarefas aprovadas em `TASKS.md`.
