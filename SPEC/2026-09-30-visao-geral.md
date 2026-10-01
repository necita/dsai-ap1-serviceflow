# SPEC — Visão Geral do ServiceFlow

**Data:** 2026-09-30  
**Status:** Aprovada para implementação  
**Projeto:** ServiceFlow

## 1. Objetivo

O ServiceFlow é uma plataforma configurável para gerenciamento de solicitações de serviços internos de uma organização.

A aplicação deve permitir que uma organização cadastre sua estrutura de atendimento, disponibilize um catálogo de serviços e gerencie as solicitações realizadas pelos usuários desde a abertura até a conclusão.

O sistema deve ser genérico, não ficando limitado a um setor específico.

## 2. Problema

Organizações podem possuir diferentes setores e serviços internos, mas as solicitações frequentemente são realizadas por meios dispersos, dificultando o acompanhamento, a definição de responsáveis, o controle de prazos e a rastreabilidade das ações realizadas.

O ServiceFlow deverá centralizar essas solicitações e fornecer mecanismos para acompanhamento, atendimento, aprovação, controle de prazos e registro do histórico.

## 3. Público e atores

### 3.1 Solicitante

Usuário que utiliza o catálogo de serviços para realizar solicitações e acompanhar seu andamento.

### 3.2 Atendente

Usuário responsável por realizar triagem, assumir ou encaminhar solicitações e registrar o atendimento.

### 3.3 Gestor

Usuário que pode participar de processos de aprovação e acompanhar solicitações relacionadas ao seu contexto organizacional.

### 3.4 Administrador

Usuário responsável pela configuração da plataforma, incluindo usuários, permissões, setores, categorias, serviços, fluxos e regras.

## 4. Conceito de serviço

Um serviço representa uma solicitação que pode ser disponibilizada no catálogo da organização.

Um serviço deve poder possuir configurações próprias, incluindo:

- nome;
- descrição;
- categoria;
- setor responsável;
- necessidade ou não de aprovação;
- prazo de atendimento;
- campos necessários para a solicitação;
- fluxo de atendimento.

Os serviços devem ser cadastráveis e configuráveis.

O sistema não deve depender de setores ou serviços fixos no código.

## 5. Catálogo de serviços

O sistema deve disponibilizar um catálogo no qual o solicitante possa visualizar os serviços disponíveis.

O catálogo deve permitir a organização dos serviços por categorias.

Ao selecionar um serviço, o usuário deverá visualizar as informações necessárias para realizar a solicitação.

## 6. Solicitações

Uma solicitação representa uma instância de um serviço solicitado por um usuário.

A solicitação deverá manter, conceitualmente:

- identificador;
- solicitante;
- serviço;
- categoria;
- setor responsável;
- prioridade;
- status;
- prazo;
- descrição;
- dados específicos do serviço;
- comentários;
- anexos;
- histórico;
- aprovações, quando aplicável.

O solicitante deve conseguir acompanhar o andamento da solicitação.

## 7. Fluxo de atendimento

Uma solicitação deve possuir um fluxo de atendimento.

O fluxo pode variar conforme o serviço.

Um fluxo poderá conter etapas como:

- solicitação;
- triagem;
- aprovação;
- atribuição;
- execução;
- conclusão.

Nem todos os serviços precisam possuir as mesmas etapas.

## 8. Aprovação

Determinados serviços poderão exigir aprovação antes de prosseguir para a execução.

A aprovação deve registrar:

- responsável pela decisão;
- data e hora;
- decisão;
- observação, quando aplicável.

O resultado da aprovação deve influenciar o andamento da solicitação.

## 9. SLA

Serviços poderão possuir um prazo de atendimento.

O sistema deverá permitir identificar situações relacionadas ao prazo, incluindo:

- dentro do prazo;
- próximo do vencimento;
- vencido.

O prazo deverá estar relacionado à configuração do serviço.

## 10. Histórico e auditoria

A aplicação deverá manter o histórico das principais alterações realizadas nas solicitações.

O histórico deverá permitir identificar eventos relevantes do ciclo de vida da solicitação, incluindo mudanças de status, atribuições, aprovações e conclusões.

## 11. Notificações

O sistema deverá possuir suporte a notificações relacionadas a eventos relevantes das solicitações.

Exemplos:

- nova solicitação;
- alteração de status;
- solicitação de aprovação;
- aprovação ou rejeição;
- aproximação ou vencimento de prazo;
- conclusão.

## 12. Permissões

O acesso às funcionalidades deverá considerar o perfil do usuário e suas permissões.

O sistema deverá diferenciar, no mínimo, as responsabilidades de solicitantes, atendentes, gestores e administradores.

## 13. Dashboard e relatórios

A plataforma deverá fornecer informações consolidadas sobre as solicitações.

Entre os indicadores possíveis estão:

- solicitações abertas;
- solicitações em atendimento;
- solicitações concluídas;
- solicitações próximas do vencimento;
- solicitações vencidas;
- distribuição por categoria;
- distribuição por setor;
- desempenho de atendimento.

## 14. Critérios de aceitação

A visão geral será considerada atendida quando:

- [ ] o sistema permitir representar uma organização de forma genérica;
- [ ] setores puderem ser cadastrados sem depender de valores fixos no código;
- [ ] serviços puderem ser cadastrados e configurados;
- [ ] usuários puderem utilizar um catálogo de serviços;
- [ ] uma solicitação puder ser criada a partir de um serviço;
- [ ] uma solicitação possuir ciclo de vida e status;
- [ ] diferentes serviços puderem possuir fluxos diferentes;
- [ ] serviços puderem exigir aprovação;
- [ ] serviços puderem possuir prazo de atendimento;
- [ ] o histórico das solicitações puder ser consultado;
- [ ] o sistema possuir controle de acesso baseado em perfis e permissões;
- [ ] existirem mecanismos para acompanhamento das solicitações;
- [ ] informações consolidadas das solicitações puderem ser apresentadas em dashboard ou relatórios.

## 15. Fora do escopo inicial

Não fazem parte desta SPEC, neste momento:

- integração real com sistemas externos;
- processamento real de pagamentos;
- envio de mensagens por provedores externos;
- aplicativo mobile nativo;
- funcionalidades específicas de um setor que não estejam previstas na configuração genérica da plataforma.

Esses itens poderão ser considerados posteriormente por meio de novas SPECs, caso sejam necessários ao projeto.

## 16. Observação de implementação

Esta SPEC define a visão geral do produto.

As funcionalidades específicas deverão possuir SPECs próprias antes de sua implementação.

Alterações relevantes neste escopo deverão ser registradas e justificadas antes da implementação correspondente.