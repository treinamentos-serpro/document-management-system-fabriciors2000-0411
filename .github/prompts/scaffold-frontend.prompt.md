---
description: Cria o scaffolding do frontend (componente, página e service) para um recurso.
name: scaffold-frontend
argument-hint: nome do recurso (ex. documents)
agent: agent
---

# Scaffold do frontend

Crie a estrutura do frontend para o recurso `${input:recurso:nome do recurso}` seguindo as convenções do projeto (React + Vite, componentes funcionais com Hooks).

Gere os arquivos em `frontend/src`:

1. `services/${input:recurso}Api.js` - funções de acesso ao backend via `fetch`, usando o prefixo `/api` (proxy do Vite).
2. `components/` - componentes em PascalCase para o recurso (ex. listagem, formulário), reutilizando componentes existentes quando fizer sentido.
3. `pages/` - página em PascalCase que compõe os componentes do recurso.

Requisitos:

- Use componentes funcionais com React Hooks (`useState`, `useEffect`).
- Toda comunicação com o backend passa pelo service, nunca `fetch` direto nos componentes.
- Trate erros das chamadas e exiba mensagens ao usuário em português.
- Nomes de símbolos de código em inglês; mensagens e comentários em português.
- Siga os padrões já existentes em `frontend/src` (ex. `documentApi.js`, `DocumentList.jsx`).
- Não adicione novas dependências; use apenas o que já está no `package.json`.
- Integre a nova página em `App.jsx` apenas se solicitado.
