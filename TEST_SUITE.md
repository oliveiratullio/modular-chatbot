# Suíte de Testes - Modular Chatbot

Este documento descreve a suíte de testes abrangente implementada para garantir qualidade e confiabilidade da aplicação.

## 📋 Estrutura de Testes

### Backend (`packages/backend`)

- **Testes Unitários**: Agentes, sanitização e utilitários
- **Testes E2E**: API endpoints com mocks
- **Cobertura**: ~85% para partes core

### Frontend (`packages/frontend`)

- **Smoke Tests**: Componentes principais
- **Testes de Interação**: Vitest + Testing Library
- **Cobertura**: Componentes críticos

## 🚀 Executando os Testes

### Todos os Testes

```bash
# Executa toda a suíte de testes
pnpm test:all

# Apenas testes unitários (backend + frontend)
pnpm test:unit

# Apenas testes E2E (backend)
pnpm test:e2e

# Testes com cobertura
pnpm test:coverage
```

### Testes por Pacote

#### Backend

```bash
cd packages/backend

# Testes unitários
pnpm test:unit

# Testes E2E
pnpm test:e2e

# Com cobertura
pnpm test:cov

# Watch mode
pnpm test:watch
```

#### Frontend

```bash
cd packages/frontend

# Testes unitários
pnpm test:run

# Watch mode
pnpm test

# Com UI
pnpm test:ui

# Cobertura
pnpm coverage
```

## 🧪 Tipos de Testes

### 1. Testes Unitários Backend

#### RouterAgent (`router.agent.spec.ts`)

- ✅ **Casos claros**: Expressões matemáticas vs perguntas
- ✅ **Casos ambíguos**: Números sem operadores, operadores sem números
- ✅ **Edge cases**: Strings vazias, caracteres especiais, emojis
- ✅ **Performance**: 1000 roteamentos em <100ms

#### MathAgent (`math.agent.spec.ts`)

- ✅ **Expressões válidas**: Básicas, decimais, precedência
- ✅ **Expressões inválidas**: Malformadas, injeção de código
- ✅ **Precisão numérica**: Decimais, overflow, underflow
- ✅ **Segurança**: Bloqueio de code injection

#### Sanitização (`sanitize.spec.ts`, `chat.controller.spec.ts`)

- ✅ **HTML stripping**: Tags básicas e aninhadas
- ✅ **Prompt injection**: Padrões maliciosos
- ✅ **Validação**: Comprimento, caracteres, tipos
- ✅ **Casos edge**: Unicode, caracteres especiais

### 2. Testes E2E Backend (`chat.e2e-spec.ts`)

#### Fluxo MathAgent

- ✅ **Roteamento**: 2+3 → MathAgent → Result: 5
- ✅ **Workflow correto**: RouterAgent → MathAgent
- ✅ **Expressões complexas**: (2+3)\*4/2+4

#### Fluxo KnowledgeAgent

- ✅ **Perguntas knowledge**: Taxa da maquininha
- ✅ **Respostas sem fonte**: Informação não encontrada
- ✅ **Workflow correto**: RouterAgent → KnowledgeAgent

#### Validação & Segurança

- ✅ **Payload inválido**: Campos obrigatórios
- ✅ **Prompt injection**: Bloqueio automático
- ✅ **Sanitização**: HTML tags removidas
- ✅ **Tratamento de erro**: Responses apropriadas

### 3. Testes Frontend

#### ChatArea (`ChatArea.test.tsx`)

- ✅ **Estados**: Sem conversa, conversa ativa, loading
- ✅ **Responsividade**: Desktop vs mobile
- ✅ **Interação**: Envio de mensagens
- ✅ **Scroll automático**: Mensagens mais recentes

#### ChatLayout (`ChatLayout.test.tsx`)

- ✅ **Navegação**: Desktop sidebar + mobile navigation
- ✅ **Estado**: Gerenciamento de conversas
- ✅ **Integração**: ChatService calls
- ✅ **Loading states**: Durante requisições

## 📊 Cobertura de Testes

### Metas de Cobertura

- **Global**: 80% (branches, functions, lines, statements)
- **Agentes**: 85% (RouterAgent, MathAgent, KnowledgeAgent)
- **Sanitização**: 90% (Funções críticas de segurança)

### Verificação

```bash
# Backend
cd packages/backend
pnpm test:cov

# Frontend
cd packages/frontend
pnpm coverage
```

### Relatórios

- **Backend**: `packages/backend/coverage/`
- **Frontend**: `packages/frontend/coverage/`

## 🔧 Configuração

### Jest (Backend)

```javascript
// jest.config.js
coverageThresholds: {
  global: { branches: 80, functions: 80, lines: 80, statements: 80 },
  './src/agents/': { branches: 85, functions: 85, lines: 85, statements: 85 },
  './src/utils/': { branches: 90, functions: 90, lines: 90, statements: 90 },
}
```

### Vitest (Frontend)

```javascript
// vitest.config.ts
test: {
  globals: true,
  environment: 'jsdom',
  setupFiles: ['./src/test/setup.ts'],
}
```

## 🎯 Critérios de Aceite

### ✅ Funcionalidades Core

1. **RouterAgent**: Roteamento correto para casos claros e ambíguos
2. **MathAgent**: Cálculos precisos e segurança contra injeção
3. **Sanitização**: Bloqueio de HTML/prompt injection
4. **E2E Chat**: Fluxo completo retorna agent_workflow correto
5. **Frontend**: Smoke tests para componentes principais

### ✅ Qualidade

- **Cobertura**: ~80% global, ~85% agents, ~90% sanitization
- **Performance**: Testes rápidos (<1s unitários, <5s E2E)
- **Confiabilidade**: `pnpm test:all` sempre verde
- **Documentação**: Tests autoexplicativos e bem comentados

### ✅ CI/CD Ready

```bash
# Comando único que verifica tudo
pnpm test:all

# Para CI pipelines
pnpm test:coverage
```

## 🐛 Debugging

### Testes Falhando

```bash
# Modo debug backend
cd packages/backend
pnpm test:debug

# UI interativa frontend
cd packages/frontend
pnpm test:ui
```

### Logs Detalhados

```bash
# Verbose output
pnpm test -- --verbose

# Apenas um arquivo
pnpm test -- router.agent.spec.ts
```

## 📝 Adicionando Novos Testes

### Backend

1. Arquivo: `src/**/*.spec.ts` (unitários) ou `test/**/*.e2e-spec.ts` (E2E)
2. Padrão: `describe()` → `it()` → `expect()`
3. Mocks: Jest mocking para dependências externas

### Frontend

1. Arquivo: `src/**/*.test.tsx`
2. Padrão: Vitest + Testing Library
3. Mocks: `vi.mock()` para componentes/serviços

---

**Status**: ✅ Suíte completa implementada e funcionando
**Última atualização**: Janeiro 2024
