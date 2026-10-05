# ServiceFlow

Plataforma configurável para gerenciamento de solicitações de serviços internos.

## Estado do projeto

- SF-001 a SF-025 estão concluídas.
- SF-026 continua incompleta: a contagem oficial informada é de 7.489 linhas contabilizáveis, abaixo da meta acadêmica de 100.000. Não se deve inflar a contagem com código artificial nem implementar funcionalidades fora da SPEC para tentar atingir a meta.
- SF-027 está concluída: os procedimentos documentados foram verificados com instalação limpa das dependências e execução das suites e verificações de qualidade.
- SF-028 foi revisada, mas permanece não concluída: SF-026 continua incompleta e o comando `cloc` não está disponível neste ambiente para reproduzir a contagem.
- Os fluxos E2E completos da primeira entrega já foram implementados e executados com sucesso.

## Requisitos e stack

- Node.js 24.21.0 (mínimo suportado pelo Next.js: 20.9.0).
- npm 11.19.0.

Essas versões foram usadas nas validações do projeto. A stack inclui Next.js 16.3.8, React 19.2.8, TypeScript 5, PostgreSQL com Prisma 6.16.0, Auth.js com Argon2id, Vitest e Playwright com Chromium.

## Desenvolvimento

Instale as dependências e inicie o servidor:

```bash
npm ci
npx prisma generate
npm run dev
```

A aplicação fica disponível em <http://localhost:3000>. Para usar as telas protegidas, configure o banco e crie o primeiro administrador conforme as instruções abaixo.

No Windows PowerShell, se a política de execução bloquear os launchers `npm.ps1` ou `npx.ps1`, use os equivalentes `npm.cmd` e `npx.cmd` (por exemplo, `npm.cmd run dev`); não é necessário alterar a política do sistema.

## Variáveis de ambiente

O runtime do Next.js e o Prisma usam `DATABASE_URL` para conectar ao PostgreSQL. Crie um arquivo local ignorado pelo Git (`.env.local` para Next.js; `.env` também é lido pelo Prisma CLI) a partir do exemplo:

```powershell
Copy-Item .env.example .env
```

Conteúdo esperado no arquivo local:

Inclua também `AUTH_SECRET=<segredo gerado localmente>`; gere-o pelo comando abaixo e não reutilize valores entre ambientes.

```env
NODE_ENV=development
DATABASE_URL=postgresql://serviceflow:change-me@localhost:5432/serviceflow_dev
```

- O arquivo `.env` real deve permanecer fora do Git.
- A URL do banco deve usar o protocolo `postgresql://` ou `postgres://`.
- O banco deve ser criado previamente em uma instância local do PostgreSQL e o nome do schema/database deve refletir o ambiente escolhido.
- Gere `AUTH_SECRET` localmente com `node -e "console.log(require('node:crypto').randomBytes(32).toString('base64'))"` e mantenha o valor somente no arquivo de ambiente ignorado pelo Git. Use um valor independente e protegido para cada ambiente.
- Nunca versione arquivos `.env`, `.env.local` ou `.env.test.local`, nem registre valores reais de conexão ou segredos.

## Autenticação

A autenticação usa Auth.js com credenciais locais e sessões JWT em cookie `HttpOnly`, `SameSite=Lax` e `Secure` em produção. Senhas são verificadas com Argon2id. A callback de sessão consulta o usuário atual no PostgreSQL a cada leitura, atualiza perfil/setor e descarta sessões de contas inativas; os helpers em `src/server/authorization/` aplicam as permissões server-side sem confiar em perfil ou setor enviados pelo cliente. Não há cadastro público nem credencial padrão; o primeiro administrador é provisionado manualmente pelo procedimento seguro de bootstrap abaixo.

### Primeiro administrador

Com `DATABASE_URL` configurada no ambiente local (`.env.local` ou outro arquivo reconhecido pelo Next.js), execute `npm run bootstrap:admin` uma única vez em um terminal interativo. O comando pergunta nome e e-mail e solicita a senha duas vezes sem ecoá-la; não aceita credenciais por argumentos nem variáveis de ambiente. Ele recusa a operação se já houver qualquer administrador, armazena somente o hash Argon2id e não funciona como seed recorrente. Não execute o bootstrap apontando para o banco de testes.

## PostgreSQL local

Para desenvolvimento local, crie uma instância PostgreSQL e o banco indicado por `DATABASE_URL`. Por exemplo:

```bash
createdb serviceflow_dev
```

Em seguida, configure a URL local correspondente. O ambiente de integração e E2E deve usar outra base física terminada em `_test`; não use o banco de desenvolvimento ou produção para fixtures.

## Prisma

O esquema fica em `prisma/schema.prisma` e as migrations versionadas ficam em `prisma/migrations/`. O Prisma Client é usado somente no servidor. Após uma instalação limpa (`npm ci`), gere o cliente antes de executar a aplicação ou os testes unitários. Valide também o esquema:

```bash
npx prisma validate
npx prisma generate
```

Para aplicar migrations existentes em um banco configurado:

```bash
npx prisma migrate deploy
```

`npx prisma migrate status` consulta o estado das migrations. Use `npx prisma migrate dev` somente em desenvolvimento para criar/aplicar migrations durante mudanças de schema; não edite migrations já aplicadas. Para ambientes existentes/deploy, aplique migrations versionadas com `migrate deploy`.

Os domínios administrativos server-side ficam em `src/modules/sectors/`, `src/modules/categories/`, `src/modules/users/` e `src/modules/services/`. As operações exigem autorização central de administrador; nomes de setor/categoria são case-insensitive e únicos entre registros ativos. Desativação é lógica e preserva solicitações e referências históricas. Setores/categorias com dependências impeditivas não podem ser desativados; atendentes não podem ser desativados ou transferidos se forem o único atendente ativo necessário às solicitações pendentes do setor.

### Backup e recuperação

A política operacional de backup e recuperação do PostgreSQL ainda precisa ser definida para o ambiente de execução. Defina e valide essa política, incluindo um teste de restauração isolado, antes de usar o sistema com dados reais. Consulte também a dependência registrada na seção 18 da SPEC principal; este README não presume frequência, retenção nem objetivos de recuperação.

## Fluxos disponíveis

- Administradores autenticados configuram usuários, setores, categorias e serviços em `/admin`.
- Solicitantes autenticados consultam o catálogo publicado em `/catalog`, abrem solicitações a partir do detalhe do serviço e acompanham somente suas próprias solicitações em `/requests`.
- Atendentes autenticados consultam a fila do setor em `/queue` e iniciam/concluem solicitações permitidas. O setor da fila é o snapshot registrado na abertura; não há atribuição individual.
- A rota inicial encaminha a sessão autenticada à interface do perfil obtido do servidor; o cliente não escolhe papel.
- A abertura valida no servidor a disponibilidade atual do serviço, categoria e setor e grava snapshots e evento inicial junto da solicitação. Transições persistem status e evento de histórico atomicamente.

## Testes

As suites podem ser executadas separadamente:

```bash
npm run test:unit
npm run test:integration
npm run test:e2e
```

Os testes de integração e E2E exigem um banco PostgreSQL **dedicado** cujo nome termine em `_test`. Nunca use o banco de desenvolvimento ou produção. Crie uma base física separada (por exemplo, `serviceflow_test`); para Supabase, use uma base de teste separada, não apenas outro schema no banco de desenvolvimento.

Copie `.env.test.example` para `.env.test.local` e configure `TEST_DATABASE_URL` com a URL do banco de teste:

```powershell
Copy-Item .env.test.example .env.test.local
```

O arquivo `.env.test.local` é ignorado pelo Git. Os runners validam que a URL de teste aponta para uma base dedicada terminada em `_test`, não a mesma base de `DATABASE_URL`, e não usam `DATABASE_URL` como fallback. A suite de integração gera o Prisma Client, testa a conexão e aplica migrations exclusivamente na base de teste; seus fixtures são limpos antes de cada teste. O setup E2E também aplica migrations, limpa a base dedicada e cria um administrador de teste antes de iniciar o navegador. Essa limpeza é destrutiva para os dados da base E2E: mantenha-a exclusiva para testes e para um processo/job por vez.

Instale o Chromium do Playwright uma vez por máquina:

```bash
npm exec -- playwright install chromium
```

Os testes E2E completos já cobrem bootstrap/login, configuração administrativa, catálogo, abertura e consulta das próprias solicitações, atendimento, conclusão e negações críticas para acesso a solicitação alheia ou de outro setor.

## Verificações

```bash
npm run typecheck
npm run lint
npm run build
```

Para servir a versão compilada, execute `npm run start` após o build.

O progresso e as validações por tarefa são registrados em `TASKS.md`, `NOTES.md` e `diario/`. A contagem oficial atual de 7.489 linhas está abaixo da meta de 100.000; SF-026 permanece incompleta. Não se deve acrescentar código artificial ou funcionalidades fora da SPEC para alterar essa contagem. Qualquer ampliação funcional exige aprovação explícita e uma nova SPEC.
