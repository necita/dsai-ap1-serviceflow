# AGENTS.md — ServiceFlow

## Objetivo

O ServiceFlow é uma plataforma configurável para gerenciamento de solicitações de serviços internos de uma organização.

O sistema deve permitir que uma organização cadastre setores, categorias, serviços, usuários, permissões, fluxos, aprovações e regras de atendimento.

Usuários poderão utilizar o catálogo de serviços para abrir solicitações e acompanhar seu andamento.

## Regras de desenvolvimento

1. A SPEC é a fonte de verdade para cada funcionalidade.
2. Não implementar uma funcionalidade antes da SPEC correspondente estar registrada no diretório `SPEC/`.
3. Não alterar o escopo definido na SPEC sem registrar a mudança.
4. Antes de implementar, analisar os arquivos e o contexto existente do projeto.
5. Preservar funcionalidades já implementadas.
6. Não criar funcionalidades fictícias apenas para aumentar o tamanho do projeto.
7. Toda funcionalidade deve possuir critérios de aceitação verificáveis.
8. Executar os testes relacionados após alterações.
9. Não ignorar erros de teste ou build.
10. Não adicionar senhas, tokens, chaves ou outros segredos ao repositório.
11. Não modificar dependências sem necessidade.
12. Registrar decisões relevantes em `NOTES.md`.
13. Registrar as sessões e prompts utilizados durante o desenvolvimento em `prompts/sessoes/`.
14. Manter o diário de desenvolvimento em `diario/`.
15. Antes de cada commit, verificar `git status` e revisar os arquivos alterados.
16. Commits devem ter mensagens claras e relacionadas à alteração realizada.

## Processo

Para cada funcionalidade:

1. Consultar a SPEC correspondente.
2. Identificar os critérios de aceitação.
3. Planejar a implementação.
4. Implementar.
5. Executar testes.
6. Corrigir problemas encontrados.
7. Executar novamente os testes.
8. Revisar as alterações.
9. Registrar informações relevantes.
10. Criar o commit.

## Arquitetura do produto

O ServiceFlow deve ser genérico e configurável.

Não assumir setores específicos como parte obrigatória do sistema.

Exemplos como TI, RH ou manutenção podem ser utilizados para testes e demonstrações, mas os setores e serviços devem ser cadastráveis.

## Qualidade

O agente deve:

- evitar alterações desnecessárias;
- explicar problemas encontrados;
- não afirmar que algo foi testado quando não foi;
- não ocultar falhas;
- utilizar as ferramentas disponíveis para verificar suas conclusões.

## Git

Nunca apagar ou reescrever histórico sem solicitação explícita.

Antes de qualquer commit:

- verificar `git status`;
- verificar os arquivos alterados;
- confirmar que não existem segredos;
- confirmar que a alteração corresponde à SPEC em desenvolvimento.

## Fora de escopo automático

Não adicionar funcionalidades apenas porque parecem úteis.

Novas funcionalidades devem ser registradas em uma SPEC ou em uma atualização de SPEC antes de serem implementadas.