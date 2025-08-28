# Configuração de Variáveis de Ambiente - Kubernetes

Este documento explica como configurar as variáveis de ambiente para o Modular Chatbot no Kubernetes.

## ConfigMap (infra/k8s/configmap.yaml)

O ConfigMap contém todas as configurações não-sensíveis da aplicação:

### Backend Configuration

- `NODE_ENV`: Ambiente de execução (production/development)
- `PORT`: Porta do servidor (8080)
- `APP_VERSION`: Versão da aplicação
- `LOG_LEVEL`: Nível de log (info/debug/warn/error)

### Redis Configuration

- `REDIS_NAMESPACE`: Namespace do Redis para RAG (rag)
- `REDIS_URL`: URL de conexão com Redis

### Rate Limiting

- `RATE_LIMIT_MAX`: Máximo de requisições por janela (120)
- `RATE_LIMIT_WINDOW`: Janela de tempo (1 minute)
- `RATE_LIMIT_ALLOWLIST`: Lista de IPs permitidos

### Message Validation

- `MSG_MAX_LEN`: Tamanho máximo da mensagem (1000)

### RAG Configuration

- `RAG_TOP_K`: Número de documentos similares (5)
- `RAG_ANSWER_MODEL`: Modelo para respostas (gpt-4o-mini)
- `RAG_CHUNK_SIZE`: Tamanho do chunk (3000)
- `RAG_CHUNK_OVERLAP`: Overlap entre chunks (600)
- `RAG_MAX_URLS`: Máximo de URLs para crawler (30)
- `RAG_EMBED_BATCH`: Tamanho do batch para embeddings (8)
- `RAG_EMBED_RETRIES`: Tentativas para embeddings (3)
- `RAG_EMBED_BACKOFF_MS`: Backoff entre tentativas (1000ms)

### Embeddings Configuration

- `EMBEDDINGS_MODEL`: Modelo de embeddings (text-embedding-3-small)

### TTL Configuration

- `CHAT_HISTORY_TTL`: TTL do histórico de chat (7 dias)
- `AGENT_LOG_TTL`: TTL dos logs dos agentes (7 dias)
- `USER_CONV_INDEX_TTL`: TTL do índice de conversas (30 dias)

### Frontend Configuration

- `VITE_API_URL`: URL da API para o frontend

## Secret (infra/k8s/secret.yaml)

O Secret contém informações sensíveis que não devem ser expostas:

### OpenAI Configuration

- `OPENAI_API_KEY`: Chave da API OpenAI
- `OPENAI_BASE_URL`: URL base da API OpenAI

### DeepSeek Configuration (alternativa ao OpenAI)

- `DEEPSEEK_API_KEY`: Chave da API DeepSeek
- `DEEPSEEK_API_BASE_URL`: URL base da API DeepSeek

### RAG Seed URLs

- `RAG_SEED_URLS`: URLs para crawler (separadas por vírgula)
- `RAG_SEED_SITEMAP`: Sitemap para crawler

## Como Configurar

### 1. Editar o Secret

```bash
# Editar o arquivo secret.yaml
kubectl edit secret app-secrets -n app
```

Ou editar o arquivo `infra/k8s/secret.yaml` e aplicar:

```bash
kubectl apply -f infra/k8s/secret.yaml
```

### 2. Configurar Chaves de API

Substitua os valores no `secret.yaml`:

```yaml
stringData:
  OPENAI_API_KEY: "sk-your-actual-openai-key"
  DEEPSEEK_API_KEY: "sk-your-actual-deepseek-key"
```

### 3. Configurar URLs do RAG

```yaml
stringData:
  RAG_SEED_URLS: "https://your-domain.com/docs,https://your-domain.com/help"
  RAG_SEED_SITEMAP: "https://your-domain.com/sitemap.xml"
```

### 4. Aplicar Configurações

```bash
# Aplicar ConfigMap
kubectl apply -f infra/k8s/configmap.yaml

# Aplicar Secret
kubectl apply -f infra/k8s/secret.yaml

# Reiniciar deployments para pegar as novas configurações
kubectl rollout restart deployment/backend -n app
kubectl rollout restart deployment/frontend -n app
```

## Verificação

### Verificar ConfigMap

```bash
kubectl get configmap app-config -n app -o yaml
```

### Verificar Secret

```bash
kubectl get secret app-secrets -n app -o yaml
```

### Verificar Variáveis no Pod

```bash
# Backend
kubectl exec -it deployment/backend -n app -- env | grep -E "(OPENAI|REDIS|RAG)"

# Frontend
kubectl exec -it deployment/frontend -n app -- env | grep VITE
```

## Troubleshooting

### Problemas Comuns

1. **Chave de API inválida**: Verifique se a `OPENAI_API_KEY` está correta
2. **Redis não conecta**: Verifique se o `REDIS_URL` está correto
3. **Frontend não acessa API**: Verifique se o `VITE_API_URL` está correto
4. **RAG não funciona**: Verifique se as URLs em `RAG_SEED_URLS` são acessíveis

### Logs

```bash
# Ver logs do backend
kubectl logs -f deployment/backend -n app

# Ver logs do frontend
kubectl logs -f deployment/frontend -n app
```
