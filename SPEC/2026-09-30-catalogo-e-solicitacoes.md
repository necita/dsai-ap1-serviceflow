# SPEC — Catálogo configurável e ciclo básico de solicitações

**Data:** 2026-09-30  
**Status:** Aprovada  
**Projeto:** ServiceFlow  
**Referência:** `SPEC/2026-09-30-visao-geral.md`

## 1. Objetivo

Entregar a base funcional do ServiceFlow para uma organização: permitir que um administrador configure setores, categorias, serviços e usuários; que solicitantes encontrem serviços ativos e abram solicitações; e que atendentes da área responsável acompanhem e concluam essas solicitações por um ciclo de status fixo.

Esta entrega estabelece entidades, permissões, persistência e histórico mínimos para que funcionalidades posteriores possam ser especificadas e desenvolvidas sobre uma base coerente. Não implementa os recursos avançados descritos na visão geral.

## 2. Contexto

Solicitações internas precisam de um ponto de entrada comum, de um responsável organizacional e de estados que possam ser acompanhados. Nesta entrega, o catálogo é configurado pela organização e não contém setores ou serviços fixos no código.

A instalação atende uma única organização. A configuração administrativa e o ciclo básico de solicitações são os limites desta SPEC. Os perfis são mutuamente exclusivos: cada usuário ativo possui exatamente um perfil, sem herança implícita de permissões entre perfis.

## 3. Atores e permissões

### 3.1 Administrador

- É provisionado no sistema por um procedimento inicial seguro, sem credenciais embutidas no código ou repositório.
- Pode criar, consultar, editar e desativar usuários, setores, categorias e serviços, respeitadas as regras desta SPEC.
- Não pode abrir solicitações em nome de outros usuários, consultar solicitações ou mudar seus status por possuir o perfil de administrador.
- Não pode remover ou desativar o último administrador ativo.

### 3.2 Solicitante

- Pode consultar o catálogo publicado, abrir solicitações para si próprio e consultar somente as solicitações que abriu.
- Não pode configurar catálogo ou usuários, nem alterar o status de uma solicitação.
- Não possui setor associado para fins de autorização.

### 3.3 Atendente

- É associado a exatamente um setor ativo por vez.
- Pode consultar solicitações do setor ao qual está associado e avançar seus status conforme o fluxo definido nesta SPEC.
- Não pode configurar setores, categorias, serviços ou usuários, nem consultar solicitações de outros setores.
- Não possui atribuição individual de solicitações; solicitações abertas e em atendimento ficam na fila do setor e podem ser tratadas por qualquer atendente ativo desse setor.

O perfil é um campo obrigatório e exclusivo do usuário: `ADMIN`, `REQUESTER` ou `ATTENDANT`. Uma conta não combina permissões de perfis diferentes. Um administrador que também precise solicitar serviços deverá usar uma conta separada de solicitante.

## 4. Escopo

- Autenticação de usuários provisionados pelo administrador ou pelo procedimento inicial de bootstrap.
- Administração de usuários, com perfil e estado ativo/inativo.
- Cadastro, consulta, edição e desativação lógica de setores, categorias e serviços.
- Associação de cada serviço a uma categoria e a um setor responsável.
- Catálogo visível a solicitantes contendo somente serviços disponíveis.
- Abertura de solicitação com descrição livre e dados históricos imutáveis do serviço no momento da abertura.
- Consulta das próprias solicitações pelo solicitante.
- Fila de solicitações por setor para atendentes.
- Transição de status de Aberta para Em atendimento e de Em atendimento para Concluída.
- Histórico de criação e de todas as transições de status, com ator e instante.
- Interface web responsiva suficiente para executar os fluxos acima.

## 5. Fora de escopo

Não fazem parte desta entrega:

- SLA, prazos de atendimento, alertas ou priorização;
- aprovação;
- campos personalizados;
- anexos;
- comentários ou conversas;
- notificações;
- dashboard ou relatórios;
- fluxos configuráveis por serviço;
- atribuição individual de solicitações;
- reabertura ou cancelamento;
- integrações externas, provedores externos de mensagens ou pagamentos;
- aplicativo mobile nativo;
- múltiplas organizações na mesma instalação.

Esses itens exigem SPECs próprias antes de qualquer implementação correspondente.

## 6. Entidades e seus relacionamentos

Todas as entidades persistidas possuem identificador UUID e datas em UTC. Datas de criação e atualização são geradas pelo servidor. Registros de configuração e usuários são desativados logicamente; não são apagados fisicamente por operações normais da aplicação.

### 6.1 Usuário (`User`)

Campos mínimos:

- `id` (UUID, chave primária);
- `name` (obrigatório, não vazio);
- `email` (obrigatório, único sem distinção entre maiúsculas e minúsculas);
- `role` (obrigatório: `ADMIN`, `REQUESTER` ou `ATTENDANT`);
- `sector_id` (nulo para administrador e solicitante; obrigatório para atendente);
- `password_hash` (credencial armazenada somente como hash pela camada de autenticação; nunca retornada à interface);
- `is_active` (booleano);
- `created_at`, `updated_at`.

O atendente pertence a exatamente um setor. A associação é feita pelo administrador e deve apontar para um setor existente. Um atendente não pode estar associado a setor inativo. Ao desativar ou mudar o setor de um atendente, aplicam-se as proteções para solicitações pendentes descritas nas regras de negócio.

### 6.2 Setor (`Sector`)

Campos mínimos: `id`, `name` (obrigatório e não vazio), `is_active`, `created_at`, `updated_at`.

Um setor possui zero ou mais serviços e usuários atendentes. Solicitações abertas a partir de serviços associados a ele mantêm o identificador e o nome do setor de origem como snapshot.

### 6.3 Categoria (`Category`)

Campos mínimos: `id`, `name` (obrigatório e não vazio), `is_active`, `created_at`, `updated_at`.

Uma categoria possui zero ou mais serviços. Solicitações mantêm o identificador de referência quando disponível e o nome da categoria como snapshot histórico.

### 6.4 Serviço (`Service`)

Campos mínimos: `id`, `name` (obrigatório e não vazio), `description` (obrigatória e não vazia), `category_id` (obrigatório), `sector_id` (obrigatório), `is_active`, `created_at`, `updated_at`.

Cada serviço pertence a exatamente uma categoria e a exatamente um setor responsável. Não há campos de formulário customizados nesta entrega.

### 6.5 Solicitação (`Request`)

Campos mínimos:

- `id` (UUID, chave primária);
- `requester_id` (obrigatório, referência ao usuário solicitante);
- `service_id` (obrigatório, referência ao serviço de origem, preservada sem exclusão física);
- `sector_id` (obrigatório, setor responsável na abertura; usado para autorização e fila);
- `service_name_snapshot` (obrigatório);
- `service_description_snapshot` (obrigatório);
- `category_id_snapshot` (obrigatório, identificador da categoria no momento da abertura);
- `category_name_snapshot` (obrigatório);
- `sector_name_snapshot` (obrigatório);
- `description` (obrigatória, descrição fornecida pelo solicitante);
- `status` (obrigatório: `OPEN`, `IN_PROGRESS` ou `COMPLETED`);
- `created_at`, `updated_at`, `completed_at` (nulo até a conclusão).

A solicitação pertence a um solicitante, foi criada a partir de um serviço e mantém o setor de atendimento da abertura. Os snapshots preservam os dados exibidos e as relações relevantes da configuração no instante da criação. O solicitante é preservado pela referência ao usuário; contas referenciadas não são apagadas fisicamente.

### 6.6 Evento de histórico (`RequestStatusEvent`)

Campos mínimos: `id`, `request_id`, `actor_id`, `from_status` (nulo somente na criação), `to_status`, `occurred_at`.

Cada evento pertence a uma solicitação e referencia o usuário que realizou a operação. Eventos são somente de acréscimo: não podem ser editados ou apagados pela aplicação. Não incluem comentário ou observação livre.

### 6.7 Relacionamentos

- `Sector 1:N User` para usuários com perfil `ATTENDANT`.
- `Sector 1:N Service`.
- `Category 1:N Service`.
- `User 1:N Request` como solicitante.
- `Service 1:N Request` como serviço de origem.
- `Sector 1:N Request` como setor responsável registrado na abertura.
- `Request 1:N RequestStatusEvent`.
- `User 1:N RequestStatusEvent` como ator dos eventos.

Restrições relacionais devem impedir referências inexistentes. Os registros relacionados a solicitações não podem ser apagados fisicamente enquanto houver referências.

## 7. Regras de negócio

1. Somente usuários ativos podem autenticar e executar operações.
2. Não há cadastro público. Contas são criadas pelo administrador ou pelo bootstrap inicial.
3. E-mails são normalizados para comparação e devem ser únicos sem distinção entre maiúsculas e minúsculas.
4. Um usuário possui exatamente um perfil. Somente atendentes possuem `sector_id`; atendentes precisam ter um setor ativo.
5. O administrador não recebe permissões operacionais sobre solicitações implicitamente.
6. Só é possível criar uma solicitação para serviço ativo, cuja categoria e setor também estejam ativos no momento da criação.
7. A descrição da solicitação deve conter texto não vazio após remoção de espaços nas extremidades e ter no máximo 10.000 caracteres. O limite é obrigatório e deve ser aplicado no servidor e na interface.
8. O status inicial é `OPEN`. O solicitante não pode escolher nem alterar o status.
9. Cada transição autorizada e válida atualiza a solicitação e cria o evento de histórico correspondente na mesma transação.
10. Repetir uma operação de transição já concluída ou tentar uma transição inválida não deve alterar a solicitação nem criar evento.
11. Solicitações e eventos não são apagáveis por operações da aplicação.
12. Desativar um usuário impede novos logins e operações, mas preserva solicitações e eventos já registrados.
13. Deve permanecer ao menos um administrador ativo. A aplicação rejeita a desativação, rebaixamento ou mudança de estado que deixe zero administradores ativos.
14. Não se permite mudar o setor de um atendente nem desativar sua conta quando ele for o último atendente ativo daquele setor com solicitações `OPEN` ou `IN_PROGRESS`. O administrador deve primeiro manter outro atendente ativo no setor ou concluir as solicitações pendentes por um atendente autorizado.
15. Uma solicitação não é atribuída a uma pessoa. Qualquer atendente ativo do setor registrado na solicitação pode efetuar sua próxima transição.
16. Renomear ou editar um serviço, categoria ou setor afeta a configuração atual e futuras solicitações; não altera os snapshots das solicitações já criadas.
17. Mudanças em `service.sector_id` aplicam-se somente a solicitações futuras. Solicitações existentes permanecem no setor registrado em `Request.sector_id`.
18. Operações concorrentes sobre a mesma solicitação devem validar o status atual no momento da gravação. No máximo uma transição válida pode ser aplicada a partir de um mesmo estado.

## 8. Fluxo completo da solicitação

1. O administrador cria ou ativa setores e categorias.
2. O administrador cria ou ativa serviços, associando cada serviço a uma categoria e a um setor ativos.
3. O administrador provisiona um solicitante e um ou mais atendentes. Cada atendente é associado a exatamente um setor ativo.
4. O solicitante autentica e consulta o catálogo. A interface apresenta somente serviços ativos associados a categoria e setor ativos.
5. O solicitante seleciona um serviço e envia uma descrição obrigatória.
6. O servidor confirma identidade, perfil, estado ativo do usuário, disponibilidade atual do serviço/categoria/setor e validade da descrição. Em uma transação, cria a solicitação com status `OPEN`, copia os dados de snapshot e cria o evento inicial (`from_status = null`, `to_status = OPEN`).
7. O solicitante consulta a solicitação na própria lista e vê seu status atual. Não acessa solicitações de terceiros.
8. Um atendente ativo associado ao setor gravado na solicitação consulta a fila do setor e inicia o atendimento, mudando `OPEN` para `IN_PROGRESS`.
9. O mesmo atendente ou outro atendente ativo do mesmo setor conclui o atendimento, mudando `IN_PROGRESS` para `COMPLETED`.
10. Cada mudança atualiza `updated_at`, registra um evento com ator, estado anterior, novo estado e horário UTC; na conclusão, define também `completed_at`.

Não há ação de solicitante ou administrador para intervir no fluxo após sua criação. Não há transições além das descritas na seção 9.

## 9. Estados e transições permitidas

Estados persistidos:

- `OPEN` (Aberta): criada e aguardando início do atendimento;
- `IN_PROGRESS` (Em atendimento): atendimento iniciado;
- `COMPLETED` (Concluída): atendimento encerrado.

Transições permitidas:

| Estado atual | Estado seguinte | Ator autorizado | Efeito |
| --- | --- | --- | --- |
| inexistente | `OPEN` | Solicitante autenticado, na criação | Cria solicitação, snapshot e evento inicial |
| `OPEN` | `IN_PROGRESS` | Atendente ativo do setor da solicitação | Atualiza estado e acrescenta evento |
| `IN_PROGRESS` | `COMPLETED` | Atendente ativo do setor da solicitação | Atualiza estado, define `completed_at` e acrescenta evento |

Todas as demais transições são proibidas, inclusive `OPEN` para `COMPLETED`, retorno para estado anterior, reabertura e cancelamento. Solicitações concluídas são terminais.

## 10. Regras de autorização por perfil

A autorização é aplicada no servidor em toda leitura ou mutação protegida. Ocultar botões ou páginas não é controle de acesso.

| Operação | Administrador | Solicitante | Atendente |
| --- | --- | --- | --- |
| Criar/editar/desativar usuários e configuração | Permitido | Negado | Negado |
| Consultar catálogo publicado | Negado nesta entrega | Permitido | Negado nesta entrega |
| Abrir solicitação para si | Negado | Permitido | Negado |
| Listar/consultar solicitação | Negado | Somente se for o solicitante | Somente se `Request.sector_id` for seu setor atual |
| Mudar status | Negado | Negado | Somente no setor atual e conforme transições permitidas |
| Consultar histórico de solicitação | Negado | Somente se for o solicitante | Somente se a solicitação pertencer ao seu setor atual |

A negação do acesso do administrador a solicitações é intencional nesta primeira entrega: o perfil administra configuração, não conteúdo operacional. Uma futura SPEC pode alterar esse modelo.

Antes de executar cada operação, o servidor deve verificar:

- sessão autenticada e usuário ainda ativo;
- perfil necessário à operação;
- propriedade do recurso pelo solicitante ou correspondência do setor do atendente, quando aplicável;
- estado atual da solicitação e validade da transição;
- estado ativo e relações válidas de serviço, categoria e setor na abertura;
- que identificadores de ator, solicitante e setor usados na persistência vêm da sessão e de relações validadas no servidor, nunca de valores fornecidos livremente pelo cliente.

Falhas de autorização não podem revelar dados de solicitações ou configuração restrita. A resposta pode ser de recurso não encontrado ou acesso negado, desde que o comportamento seja consistente e não exponha a existência de dados alheios.

## 11. Regras para setores, categorias e serviços

### Setores

- Nome obrigatório e não vazio; nomes de setores ativos devem ser únicos sem distinção entre maiúsculas e minúsculas.
- Setor pode ser editado e desativado, mas não apagado fisicamente.
- A desativação é rejeitada enquanto houver serviço ativo associado ou solicitação não concluída (`OPEN` ou `IN_PROGRESS`) registrada para o setor.
- Um setor inativo não pode receber novos atendentes nem serviços ativos. Solicitações concluídas e seu histórico continuam consultáveis por seus solicitantes.

### Categorias

- Nome obrigatório e não vazio; nomes de categorias ativas devem ser únicos sem distinção entre maiúsculas e minúsculas.
- Categoria pode ser editada e desativada, mas não apagada fisicamente.
- A desativação é rejeitada enquanto houver serviço ativo associado.
- Categoria inativa não pode ser usada por serviço ativo e seus serviços não aparecem no catálogo enquanto permanecer inativa.

### Serviços

- Nome e descrição obrigatórios e não vazios; categoria e setor obrigatórios.
- Um serviço só pode ser ativado quando sua categoria e seu setor estiverem ativos.
- Um serviço ativo fica indisponível para novas solicitações assim que ele, sua categoria ou seu setor estiver inativo.
- Desativar serviço é permitido mesmo que existam solicitações associadas. Isso impede novas solicitações, mas não remove, oculta ou bloqueia o atendimento das já criadas.
- Serviço pode ser editado; mudanças valem para novas solicitações. Serviço referenciado não pode ser apagado fisicamente.
- Reativar categoria ou setor não reativa serviços que tenham sido desativados individualmente. A disponibilidade depende de cada entidade estar ativa e de todas as relações requeridas também estarem ativas.

As validações de desativação e ativação devem ocorrer no servidor e ser atômicas em relação à gravação, para evitar a criação de solicitação contra configuração que se tornou indisponível durante a operação.

## 12. Regras para preservação do contexto histórico

No momento da criação, a solicitação deve armazenar, em campos próprios imutáveis:

- identificador do serviço de origem;
- nome e descrição do serviço;
- identificador e nome da categoria;
- identificador do setor responsável e seu nome.

Além dos snapshots, `Request.sector_id` mantém a área responsável original para roteamento e autorização. Editar o serviço para outro setor não migra solicitações existentes. Renomear ou desativar serviço, categoria ou setor não modifica os snapshots nem apaga solicitações ou eventos.

A referência ao serviço permanece válida porque entidades referenciadas não são fisicamente apagadas. Se a camada de dados permitir remoção administrativa fora da aplicação, a integridade referencial deve impedir apagar registros relacionados. Os snapshots são a fonte para exibir como o serviço e a organização eram apresentados quando a solicitação foi aberta; os registros atuais da configuração são fonte apenas para operações atuais.

Os eventos de status são imutáveis e preservam o identificador do ator. Usuários referenciados por solicitações ou eventos também não são fisicamente apagados pela aplicação.

## 13. Dados obrigatórios da solicitação

Para aceitar a criação, o servidor exige:

- usuário solicitante autenticado, ativo e com perfil `REQUESTER`;
- `service_id` existente e atualmente disponível;
- descrição não vazia após remoção de espaços periféricos, com máximo de 10.000 caracteres;
- dados de snapshot obtidos da configuração validada no servidor;
- identificador gerado, status inicial `OPEN` e horários gerados pelo servidor.

O cliente não pode definir `requester_id`, `sector_id`, snapshots, status, eventos, `created_at` ou `completed_at`. Esses valores são derivados da sessão, do serviço e das relações carregadas e validadas pelo servidor. Prioridade não é coletada nesta entrega.

## 14. Histórico de alterações de status

Gerar um evento nas seguintes situações:

1. **Criação:** evento com `from_status = null`, `to_status = OPEN`, ator igual ao solicitante e horário do servidor.
2. **Início do atendimento:** evento com `from_status = OPEN`, `to_status = IN_PROGRESS`, ator igual ao atendente autenticado.
3. **Conclusão:** evento com `from_status = IN_PROGRESS`, `to_status = COMPLETED`, ator igual ao atendente autenticado.

A gravação do evento e a atualização de status pertencem à mesma transação: ambas são confirmadas ou ambas são revertidas. Eventos não são criados para tentativas inválidas, negadas, repetidas ou para alterações de dados de usuário/configuração. A ordenação é por `occurred_at` e, em caso de empate, por identificador estável do evento.

## 15. Critérios de aceitação verificáveis

- [ ] Um administrador autenticado consegue criar, editar e desativar setores, categorias, serviços e usuários dentro das restrições desta SPEC.
- [ ] A aplicação rejeita e-mails duplicados sem distinção entre maiúsculas e minúsculas e usuários inconsistentes com perfil/setor.
- [ ] Um atendente não pode ser criado sem setor ativo; o servidor impede mudança ou desativação que deixe solicitações pendentes sem atendente ativo no setor.
- [ ] O catálogo do solicitante exibe apenas serviços ativos cuja categoria e setor também estejam ativos.
- [ ] A aplicação rejeita ativar serviço com categoria ou setor inativo e rejeita desativar categoria/setor que viole as dependências definidas.
- [ ] Um solicitante ativo consegue abrir uma solicitação somente com descrição válida e serviço disponível; campos de identidade, status, setor, snapshots e datas são definidos pelo servidor.
- [ ] A solicitação criada tem estado `OPEN`, snapshots corretos de serviço/categoria/setor e exatamente um evento inicial coerente.
- [ ] Editar ou desativar serviço, categoria ou setor não muda snapshots nem eventos de solicitações existentes; desativar serviço não impede o atendimento das solicitações existentes.
- [ ] Um solicitante consegue consultar suas solicitações e histórico e não consegue consultar solicitações de outro solicitante, mesmo requisitando diretamente seus identificadores à API.
- [ ] Um atendente consegue consultar e avançar solicitações do próprio setor e não consegue consultar ou alterar solicitações de outro setor.
- [ ] Administrador, solicitante e usuário não autenticado não conseguem executar transições de status; um administrador não obtém acesso operacional apenas pelo seu perfil.
- [ ] Somente `OPEN → IN_PROGRESS` e `IN_PROGRESS → COMPLETED` são aceitas; transições inválidas, repetidas, concorrentes ou após conclusão não alteram o registro nem criam evento.
- [ ] Cada transição válida grava exatamente um evento imutável com ator, estados e horário UTC; concluir também define `completed_at`.
- [ ] Usuário inativo não autentica nem executa operações; desativação não apaga solicitações ou eventos e a aplicação preserva ao menos um administrador ativo.
- [ ] A suíte automatizada cobre as regras de negócio, autorização, persistência e o percurso web completo definido nesta SPEC.

## 16. Estratégia de testes

### Testes unitários

- validação e normalização de e-mail;
- combinações válidas de perfil e setor;
- regras de ativação/desativação de setor, categoria e serviço;
- validação de descrição e disponibilidade de serviço;
- matriz de transições de status, incluindo estados terminais;
- decisões de autorização para administrador, solicitante e atendente;
- criação de snapshots a partir da configuração vigente.

### Testes de integração

Usar PostgreSQL de teste e testar persistência, relações, restrições e transações:

- provisionar usuários e configuração e abrir solicitação;
- verificar snapshots, setor de roteamento e evento inicial;
- executar transições e verificar eventos, timestamps e `completed_at`;
- comprovar rollback conjunto quando a gravação de evento ou solicitação falha;
- verificar efeitos de edição e desativação sobre solicitações existentes e sobre novas solicitações;
- testar concorrência de duas transições a partir do mesmo estado;
- impedir exclusão física de registros referenciados e impedir desativação do último administrador/atendente necessário.

### Testes de autorização

- acesso de solicitante a recurso próprio e tentativa de acesso a recurso alheio;
- acesso de atendente no próprio setor e tentativa em outro setor;
- tentativa por usuário inativo, não autenticado ou com perfil incorreto;
- tentativa de forjar no cliente `requester_id`, setor, status, snapshots, ator ou datas;
- acesso do administrador às operações de configuração e negação de acesso operacional às solicitações.

### Testes ponta a ponta

Cobrir no navegador: autenticação de usuários provisionados, configuração pelo administrador, publicação de serviço, abertura e acompanhamento pelo solicitante, atendimento e conclusão por atendente autorizado, e negação de operações proibidas.

## 17. Decisões técnicas iniciais

- Aplicação web em **Next.js (App Router) e TypeScript**, organizada como monólito modular.
- **PostgreSQL** como banco relacional e **Prisma** para esquema, migrações e acesso a dados.
- **Vitest** para testes unitários/integração e **Playwright** para testes ponta a ponta.
- Autenticação com biblioteca mantida compatível com Next.js (recomendação inicial: Auth.js com credenciais locais); senhas armazenadas somente com hash Argon2id. Sessões devem ser protegidas, validadas no servidor e invalidadas para usuários desativados. Não haverá cadastro público ou provedor externo nesta entrega.
- Verificações de autorização e validações de negócio são executadas no servidor em cada operação, além das validações de interface.
- Mudanças de status, criação de solicitação e evento correspondente são transacionais. Integridade relacional, índices para filas por setor e consultas por solicitante devem ser definidos no esquema.
- A implementação não deve adicionar dependências até que esta SPEC seja aprovada e a compatibilidade técnica seja verificada. Versões de ferramentas e detalhes de execução serão registrados antes ou durante a inicialização técnica, sem ampliar o escopo funcional.

## 18. Dependências da implementação

- Aprovação desta SPEC antes do início do código correspondente.
- Decisão registrada sobre biblioteca e configuração concreta de autenticação/sessões compatível com a stack aprovada.
- Ambiente local e de teste com PostgreSQL e configuração de conexão externa ao repositório.
- Estratégia segura de bootstrap do primeiro administrador, sem credenciais versionadas.
- Esquema e migrações para entidades, índices, restrições únicas e chaves estrangeiras desta SPEC.
- Política de backup e recuperação do banco definida para o ambiente de execução antes de uso com dados reais; não altera o escopo funcional.
- Ambiente de testes automatizados e execução dos testes relacionados antes de considerar a entrega concluída.

## 19. Pontos que deverão ser tratados em SPECs futuras

Cada item abaixo permanece fora desta entrega e requer SPEC própria antes de implementação:

- fluxos configuráveis por serviço e etapas adicionais;
- aprovação, responsáveis e decisões de aprovação;
- campos personalizados e validação específica de serviços;
- comentários, conversas e anexos;
- SLA, vencimento, prioridades e alertas;
- notificações por canais internos ou provedores externos;
- dashboard, indicadores e relatórios;
- atribuição individual de atendentes e transferências;
- reabertura e cancelamento de solicitações;
- integrações externas e eventual aplicação mobile nativa;
- suporte a múltiplas organizações e isolamento entre organizações;
- políticas mais detalhadas de retenção, exportação e anonimização de dados.
