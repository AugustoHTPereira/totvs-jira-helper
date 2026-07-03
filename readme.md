# 🔍 TOTVS Jira Helper (API Edition) — v3.0

O **TOTVS Jira Helper** é uma extensão de produtividade focada em desenvolvedores e engenheiros de software que atuam no ecossistema TOTVS. Ela automatiza de forma inteligente a extração de dados das tarefas e gera com precisão nomes de branches, mensagens de check-in, comentários padronizados e templates de Pull Request (PR).

A partir da versão 3.0, a extensão abandonou o Web Scraping do HTML visual e passou a se integrar nativamente à **API REST do Jira Server da TOTVS**, tornando-se imune a mudanças de layout e 100% precisa na identificação dos tipos de tarefas.

---

## 🚀 Funcionalidades e Inteligência de Automação

- **Integração Nativa via API REST**: Realiza chamadas assíncronas silenciosas em background (`/rest/api/2/issue/`) reaproveitando a própria sessão ativa do desenvolvedor no navegador, dispensando tokens ou logins adicionais.
- **Detecção de Vínculo (Scope Filter)**: A extensão identifica de forma inteligente o escopo do Jira. Ela **limita-se estritamente às Sub-tasks (issues filhas)**, evitando poluição visual quando você está navegando em demandas principais (Tasks/Pai).
- **Matriz de Decisão Inteligente para Commits**: Descobre automaticamente o prefixo ideal de check-in (`FIX`, `FEAT`, `MERGE`) cruzando o tipo da Issue Filha com o tipo da Issue Pai:
  
  | Tipo da Sub-Task (Filha) | Tipo da Task Principal (Pai) | Prefixo Gerado |
  | :--- | :--- | :--- |
  | Qualquer uma contendo "Merge" | Qualquer tipo | `MERGE` |
  | Defeito / Bug / Correção | Qualquer tipo | `FIX` |
  | Codificação / Desenvolvimento | Manutenção | `FIX` |
  | Codificação / Desenvolvimento | História / Story | `FEAT` |
  | Codificação / Desenvolvimento | Débito Técnico | `FIX` |

- **Cópia Rápida Sem Cliques Extras**: Painel minimalista integrado ao menu de status de desenvolvimento do Jira. Basta clicar em qualquer lugar da linha de informação para copiar o conteúdo para a área de transferência instantaneamente, com feedback visual de sucesso.
- **Sincronização Dinâmica em SPA**: Possui um algoritmo de pooling otimizado que monitora alterações na URL a cada 400ms combinado com um `MutationObserver` refinado. Se você mudar de tarefa clicando na barra lateral ou no backlog, os dados antigos são limpos imediatamente e o painel se atualiza sem necessidade de dar F5 na página.

---

## 📦 Estrutura de Artefatos Gerados

Ao clicar sobre as linhas do painel, você obtém os seguintes padrões prontos para uso:

1. **Branch**: Apenas a chave identificadora limpa.
2. **Issue**: O mapeamento de linhagem técnica no formato `ChaveFilha\ChavePai`.
3. **Check-in**: String pronta contendo a matriz de decisão + ID + Resumo limpo do chamado (ex: `[FEAT] DSAUPEPCONV-24150 Implementação de nova tela de faturamento`).
4. **Comentário Cliente**: Formato simplificado sem tags técnicas para comunicação externa.
5. **PR Template**: Estrutura multiline padronizada para abertura de Pull Requests.

---

## ⚙️ Arquitetura Técnica do Projeto
A extensão é construída sob a especificação moderna Manifest V3 do Google Chrome, dividida em:

`manifest.json`: Declaração segura de escopos de execução.

`content.js`: Núcleo assíncrono que gerencia o ciclo de vida do DOM, pooling ativo de URL e requisições à API REST do Jira.

`style.css`: Estilização nativa que respeita a paleta de cores do Design System do Jira (Atlassian User Interface - AUI).

##### Permissões Utilizadas
`activeTab`: Permite que o script injete as melhorias visuais estritamente na aba em foco que o usuário está visualizando.

---

## 🔐 Política de Privacidade e Segurança
Esta extensão é executada 100% localmente no client-side (navegador do usuário).

Nenhum dado de telemetria, senhas, cookies ou informações de chamados da TOTVS são coletados, armazenados ou transmitidos para servidores externos.

As requisições de API utilizam os cookies nativos e criptografados da sua própria sessão do Jira, garantindo conformidade total com as políticas de acesso e LGPD da TOTVS.