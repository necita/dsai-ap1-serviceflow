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

## Verificações

```bash
npm run typecheck
npm run lint
npm run build
```

Para servir a versão compilada, execute `npm run start` após o build.

O scaffold atual contém somente a estrutura inicial do Next.js. Banco de dados e funcionalidades do produto serão adicionados conforme as tarefas aprovadas em `TASKS.md`.
