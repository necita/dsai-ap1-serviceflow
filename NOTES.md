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

## SF-011 — Domínio de setores

- Criadas operações server-side administrativas de listagem, criação, renomeação e ativação/desativação lógica; todas exigem `requireConfigurationAdministrator` e usam a validação compartilhada de nome.
- Desativação executa em transação serializável e recusa setor com atendente ativo, serviço ativo ou solicitação `OPEN`/`IN_PROGRESS`; solicitações concluídas não impedem desativação. A verificação do atendente mantém a regra da SPEC de que atendente não pode estar associado a setor inativo. Não existe operação de exclusão física.
- A restrição global anterior foi ajustada com migration aditiva para unicidade case-insensitive somente entre setores ativos (`citext` + índice único parcial); nome de setor inativo pode ser reutilizado, mas não reativado se colidir com outro setor ativo.
- Migration `20261005163800_active_catalog_names` aplicada no `serviceflow_test` e no PostgreSQL de desenvolvimento configurado (`postgres`, schema `public`); sem reset ou exclusão de dados.
- Validações específicas: cinco testes unitários de regra, seis testes de integração PostgreSQL, `prisma validate`, typecheck e lint aprovados.
- SF-011 concluída. SF-012 foi iniciada somente depois dessa validação.

## SF-012 — Domínio de categorias

- Implementadas operações server-side administrativas de consulta, criação, edição e ativação/desativação lógica, usando autorização SF-010 e validação compartilhada.
- Categoria não pode ser desativada enquanto possuir serviço ativo. Transação serializável verifica o vínculo e mantém o estado inalterado em caso de conflito; reativação e referências não apagam dados.
- Migration `20261005164000_active_category_names` substitui a unicidade global por unicidade case-insensitive entre categorias ativas; aplicada no banco de teste e no banco de desenvolvimento.
- Validações específicas: dois unitários de regra, quatro integrações PostgreSQL, Prisma validate, typecheck e lint aprovados.
- SF-012 concluída antes de iniciar SF-013.

## SF-013 — Administração de usuários

- Adicionadas validações compartilhadas de criação/edição: nome, e-mail trim/lowercase, papel exclusivo, regra atendente-setor e senha opcional apenas em edição. Senha fornecida sempre passa por `hashPassword`; resultados e listagens omitem `passwordHash`.
- Operações administrativas de listagem, criação, edição, ativação/desativação lógica exigem `requireConfigurationAdministrator`; usuários nunca são apagados fisicamente.
- Transações serializáveis confirmam setor ativo para atendentes, bloqueiam remoção/reclassificação do último administrador ativo e protegem o último atendente ativo de setor com solicitações abertas/em atendimento.
- Integração confirmou que desativar usuário preserva referências de solicitações. SF-013 depende agora explicitamente de SF-011 e SF-012 em `TASKS.md`.
- Validações específicas: quatro testes unitários de política/validação e sete integrações PostgreSQL; typecheck e lint aprovados.
- SF-013 concluída antes de iniciar SF-014.

## SF-014 — Domínio de serviços

- Implementadas operações administrativas server-side para consultar, criar, editar e ativar/desativar serviços; todas exigem o administrador atual e validam entradas com `serviceInputSchema`.
- Categoria/setor devem existir; criação e ativação exigem ambos ativos. Atualizações de serviço ativo mantêm essa condição; serviço inativo pode ser editado sem forçar reativação.
- Desativação preserva serviço, solicitações e snapshots existentes. Edições mudam apenas a configuração atual do serviço; snapshots em `Request` não são atualizados.
- Regras de disponibilidade isoladas em policy e testadas; `assertServiceCanReceiveRequests` rejeita serviço inativo e relações inativas. A operação persistente de abertura ainda pertence a SF-017 e deverá chamar essa policy.
- Validações específicas: quatro testes unitários de disponibilidade, cinco integrações PostgreSQL; Prisma validate, typecheck e lint aprovados.
- SF-014 concluída. SF-015 e tarefas posteriores não iniciadas.

## Validações finais — SF-011 a SF-014

- `npm run test:unit`: 49 testes aprovados.
- `npm run test:integration`: 35 testes aprovados no banco físico `serviceflow_test`.
- `npm run typecheck`, `npm run lint` e `npm run build`: aprovados.
- `prisma validate` aprovado; `prisma migrate status` confirmou schema atualizado no banco de desenvolvimento (`postgres`) e no `serviceflow_test`.
- Migrations apenas substituíram índices únicos de nomes de setor/categoria por índices parciais para registros ativos; sem reset, truncamento ou exclusão de dados.

## SF-015 — Interface administrativa

- Criada página `/admin` com listagens, formulários e estados ativo/inativo de setores, categorias, usuários e serviços; serviços/usuários exibem relações atuais. O painel redireciona sessão ausente para login e perfil não autorizado para a página pública existente.
- Server Actions recebem apenas os campos necessários e delegam operações a SF-011–SF-014, que repetem autorização de administrador e validação no servidor. Mensagens públicas traduzem validação, conflito/dependência e inexistência; erros inesperados continuam sendo lançados sem expor detalhes no formulário.
- Testes unitários de Server Actions cobrem criação, edição, ativação/desativação, despacho às operações de domínio, mensagens seguras e revalidação de `/admin`; duas integrações exercitam gravação real no PostgreSQL de teste e negação por autorização.
- `npm run test:unit -- tests/unit/admin-actions.test.ts`: 3 testes aprovados; `npm run typecheck`, `npm run lint` e `npm run build` aprovados. SF-015 concluída antes de iniciar SF-016.
- Na primeira tentativa de integração administrativa, o teste usou acidentalmente o cliente Prisma padrão; foi identificado um único setor de teste órfão no banco de desenvolvimento, sem relações, e removido especificamente. O teste foi corrigido para injetar o cliente da fixture `serviceflow_test`.

## SF-016 — Catálogo publicado

- Criadas consultas autenticadas para serviços cujo próprio registro, categoria e setor estão ativos; catálogo e detalhe obtêm nomes e descrições atuais do PostgreSQL e agrupam por categoria.
- Testes: 1 unitário de agrupamento e 2 integrações de disponibilidade/detalhe. SF-016 validada antes de iniciar SF-017.

## SF-017 — Abertura transacional

- `createRequest` valida entrada estrita no servidor, usa o solicitante ativo da autorização, revalida identidade/serviço/relações na transação serializável e grava status `OPEN`, snapshots e evento inicial atomicamente.
- Testes específicos: 1 unitário de snapshots e 5 integrações para criação, dados forjados, descrição, configuração indisponível e rollback do evento. SF-017 validada antes de iniciar SF-018.

## SF-018 — Consultas do solicitante

- Lista filtra por `requesterId` da sessão. Detalhe combina o ID solicitado com o proprietário autenticado e retorna `NotFound` indistinguível para recurso alheio ou inexistente; snapshots e eventos são retornados, com histórico ordenado cronologicamente.
- Testes de integração: 2 aprovados para propriedade, ID direto alheio, snapshots e ordenação. SF-018 validada antes de iniciar SF-019.

## SF-019 — Transições e histórico

- Adicionada política estrita `OPEN → IN_PROGRESS → COMPLETED`; o destino é validado explicitamente, e o comando exige atendente autorizado, ativo e do setor atual. Status, `updatedAt`, `completedAt` e evento são gravados em transação serializável; conflito de serialização vira erro de conflito sem criar evento.
- Testes: 9 casos unitários de matriz de estado e 4 integrações de conclusão/eventos, negação, concorrência e rollback. SF-019 validada antes de iniciar SF-020.

## SF-020 — Fila do atendente

- Consultas de lista e detalhe exigem perfil atendente e limitam por `Request.sectorId`, o setor gravado na abertura, sem depender do setor atual configurado no serviço. IDs alheios/inexistentes retornam `NotFound`; não há atribuição individual.
- Testes de integração: 2 aprovados para escopo, migração da configuração do serviço e negação de acesso direto a outro setor. SF-020 validada antes de iniciar SF-021.

## SF-021 — Interface do solicitante

- Criadas rotas `/catalog`, `/catalog/[serviceId]`, `/requests` e `/requests/[requestId]`, protegidas no servidor e usando consultas/dados persistidos. Abertura envia apenas serviço e descrição à operação de domínio; interface limita descrição a 10.000 caracteres, mostra feedback/estados vazios e histórico de snapshots, sem ações de status.
- Layout mantém logout e navegação disponíveis em todas as páginas do solicitante.
- Testes de Server Action: 2 aprovados para campos permitidos, rejeição lógica de mass assignment e mensagens seguras. Build inclui todas as rotas. SF-021 validada antes de iniciar SF-022.

## SF-022 — Interface do atendente

- Criadas rotas `/queue` e `/queue/[requestId]` para fila do setor, detalhes com snapshots/histórico e ações condicionais de início/conclusão. Cada Server Action escolhe um alvo fixo no servidor e chama a transição SF-019; não há reabertura, cancelamento ou atribuição. Layout mantém logout disponível.
- A rota `/` agora consulta a sessão server-side e encaminha cada perfil à interface própria; removido o protótipo anterior em memória, que permitia escolher perfil no cliente.
- Testes de Server Action: 2 aprovados para alvo server-side e mensagens seguras. Build inclui as rotas da fila. SF-022 validada.

## Validações finais — SF-015 a SF-022

- `npm run test:unit`: 72 testes em 20 arquivos aprovados.
- `npm run test:integration`: 52 testes em 14 arquivos aprovados no banco isolado `serviceflow_test`.
- `npm run typecheck`, `npm run lint`, `npm run build`, `npx prisma validate` e `npx prisma migrate status`: aprovados; migrations sincronizadas no banco de desenvolvimento.
- A primeira execução final da suite de integração colidiu com geração simultânea do Prisma Client no build (`EPERM` no rename do DLL do Windows); repetida isoladamente, a suite completou com sucesso. Sem alteração de schema, credenciais, commit ou push. SF-023+ não iniciadas.

## SF-023 — Endurecimento server-side

- Revisados módulos, consultas e Server Actions protegidos; UUIDs e estados ativo/inativo passam por validação runtime e valores de formulário inválidos são recusados, sem converter entradas inesperadas em `false`.
- Matriz de autorização cobre perfil, usuário inativo, propriedade, setor, IDs inválidos e campos protegidos. Testes focados: 19 unitários e 4 de integração.
- A autenticação Auth.js preserva schema estrito de email/senha e encaminha somente esses campos à validação; os campos de transporte `csrfToken` e `callbackUrl` do próprio Auth.js não são tratados como dados de domínio.

## SF-024 — Cobertura automatizada

- Adicionados testes de integração para proteção de integridade referencial contra remoções físicas e para confirmar que renomeações de serviço/categoria/setor não reescrevem snapshots já persistidos.
- Suites completas aprovadas: `npm run test:unit` (73 testes) e `npm run test:integration` (58 testes no banco isolado `serviceflow_test`).

## SF-025 — Testes E2E

- Playwright executa setup em banco dedicado terminado em `_test`, aplica migrations, limpa somente esse banco e cria administrador E2E; o servidor Next usa a mesma URL isolada e um `AUTH_SECRET` efêmero.
- Um fluxo Chromium cobre bootstrap/login, administração de setores/categorias/usuários/serviços, catálogo, abertura e consulta de solicitações, atendimento/conclusão e negações por propriedade e setor.
- `npm run test:e2e` aprovado (1 cenário completo). Foi necessário encapsular o setup em função assíncrona compatível com CommonJS e adaptar o provider Auth.js para encaminhar somente email/senha à validação estrita.

## Validações finais — SF-023 a SF-025

- `npm run test:unit`: 73 aprovados; `npm run test:integration`: 58 aprovados em `serviceflow_test`; `npm run test:e2e`: 1 cenário Chromium aprovado.
- `npm run typecheck`, `npm run lint`, `npm run build`, `npx prisma validate` e `npx prisma migrate status`: aprovados. O status de migrations do banco de desenvolvimento informa schema atualizado; não houve alteração de schema.
- Durante o E2E, o servidor Next em modo desenvolvimento emitiu uma mensagem `destination stream closed early`; o fluxo e as verificações HTTP 404 esperadas passaram. Registrar caso volte a ocorrer; sem falha de teste observada.
- SF-023, SF-024 e SF-025 concluídas em 2026-10-05. SF-026+ não iniciadas; nenhuma alteração à SPEC, commit ou push.
