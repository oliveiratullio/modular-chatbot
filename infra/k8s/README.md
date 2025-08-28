# 🚀 Kubernetes Deployment - Modular Chatbot

Este diretório contém todos os manifests Kubernetes necessários para deployar o Modular Chatbot.

## 📋 Pré-requisitos

- Kubernetes cluster (1.20+)
- kubectl configurado
- NGINX Ingress Controller instalado
- Docker registry acessível (opcional)

## 🏗️ Estrutura dos Manifests

```
infra/k8s/
├── namespace.yaml      # Namespace 'app'
├── configmap.yaml      # Configurações gerais
├── secret.yaml         # Chaves sensíveis (OpenAI API Key)
├── redis.yaml          # Redis deployment + service
├── backend.yaml        # Backend deployment + service
├── frontend.yaml       # Frontend deployment + service
├── ingress.yaml        # NGINX Ingress para roteamento
├── deploy.sh           # Script de deploy automatizado
├── build-images.sh     # Script para build/push das imagens
└── README.md           # Esta documentação
```

## 🚀 Deploy Rápido

### 1. Configurar Variáveis de Ambiente

#### ConfigMap (configurações não-sensíveis)

O `configmap.yaml` já está configurado com valores padrão. Você pode modificar conforme necessário.

#### Secret (configurações sensíveis)

Edite o arquivo `secret.yaml` e adicione suas chaves de API:

```yaml
stringData:
  # OpenAI Configuration
  OPENAI_API_KEY: "sua-chave-openai-aqui"
  OPENAI_BASE_URL: "https://api.openai.com/v1"

  # DeepSeek Configuration (alternativa)
  DEEPSEEK_API_KEY: "sua-chave-deepseek-aqui"
  DEEPSEEK_API_BASE_URL: "https://api.deepseek.com/v1"

  # RAG Seed URLs
  RAG_SEED_URLS: "https://seu-dominio.com/docs,https://seu-dominio.com/help"
  RAG_SEED_SITEMAP: "https://seu-dominio.com/sitemap.xml"
```

**Importante**: Substitua os valores placeholder pelas suas chaves reais antes de aplicar.

Para mais detalhes sobre as variáveis de ambiente, consulte [ENVIRONMENT.md](./ENVIRONMENT.md).

### 2. Build das Imagens (opcional)

```bash
# Para registry local
./build-images.sh

# Para registry remoto
REGISTRY=your-registry.com IMAGE_TAG=v1.0.0 ./build-images.sh
```

### 3. Deploy

```bash
# Deploy completo
./deploy.sh

# Ou manualmente
kubectl apply -f infra/k8s/
```

## 🔧 Configurações

### ConfigMap (configmap.yaml)

Configurações gerais da aplicação:

**Backend:**

- `NODE_ENV`: Ambiente (production)
- `PORT`: Porta do backend (8080)
- `APP_VERSION`: Versão da aplicação
- `LOG_LEVEL`: Nível de log (info)

**Redis:**

- `REDIS_URL`: URL do Redis
- `REDIS_NAMESPACE`: Namespace do Redis (rag)

**Rate Limiting:**

- `RATE_LIMIT_MAX`: Máximo de requisições (120)
- `RATE_LIMIT_WINDOW`: Janela de tempo (1 minute)

**RAG:**

- `RAG_TOP_K`: Documentos similares (5)
- `RAG_ANSWER_MODEL`: Modelo para respostas (gpt-4o-mini)
- `RAG_CHUNK_SIZE`: Tamanho do chunk (3000)
- `EMBEDDINGS_MODEL`: Modelo de embeddings (text-embedding-3-small)

**Frontend:**

- `VITE_API_URL`: URL da API para o frontend

### Secret (secret.yaml)

Chaves sensíveis:

- `OPENAI_API_KEY`: Chave da API OpenAI
- `OPENAI_BASE_URL`: URL base da API OpenAI
- `DEEPSEEK_API_KEY`: Chave da API DeepSeek (alternativa)
- `DEEPSEEK_API_BASE_URL`: URL base da API DeepSeek
- `RAG_SEED_URLS`: URLs para crawler
- `RAG_SEED_SITEMAP`: Sitemap para crawler

## 📊 Recursos e Limites

### Backend

- **Requests**: 250m CPU, 512Mi RAM
- **Limits**: 500m CPU, 1Gi RAM
- **Replicas**: 2

### Frontend

- **Requests**: 100m CPU, 128Mi RAM
- **Limits**: 200m CPU, 256Mi RAM
- **Replicas**: 2

### Redis

- **Requests**: 100m CPU, 128Mi RAM
- **Limits**: 200m CPU, 256Mi RAM
- **Replicas**: 1

## 🔍 Health Checks

Todos os serviços incluem:

- **Liveness Probe**: Verifica se o pod está vivo
- **Readiness Probe**: Verifica se o pod está pronto para receber tráfego
- **Startup Probe**: Para o backend (verifica inicialização)

## 🌐 Roteamento

O Ingress roteia:

- `/api/*` → Backend Service
- `/*` → Frontend Service

### Configuração do Host

Edite `ingress.yaml` e altere o host:

```yaml
host: modular-chatbot.local # Mude para seu domínio
```

## 📝 Comandos Úteis

```bash
# Ver status dos pods
kubectl get pods -n app

# Ver logs
kubectl logs -f deployment/backend -n app
kubectl logs -f deployment/frontend -n app

# Verificar serviços
kubectl get svc -n app

# Verificar ingress
kubectl get ing -n app

# Escalar deployments
kubectl scale deployment backend --replicas=3 -n app

# Editar configurações
kubectl edit configmap app-config -n app
kubectl edit secret app-secrets -n app
```

## 🗑️ Limpeza

```bash
# Remover tudo
kubectl delete namespace app

# Ou remover recursos específicos
kubectl delete -f infra/k8s/
```

## 🔧 Troubleshooting

### Pods não ficam prontos

```bash
kubectl describe pod <pod-name> -n app
kubectl logs <pod-name> -n app
```

### Ingress não funciona

```bash
kubectl get ing -n app
kubectl describe ing app-ingress -n app
```

### Problemas de conectividade

```bash
# Testar conectividade entre pods
kubectl exec -it <pod-name> -n app -- curl backend-service:8080/health
```

## 📚 Próximos Passos

1. **Configurar SSL/TLS** com cert-manager
2. **Configurar HPA** (Horizontal Pod Autoscaler)
3. **Configurar PV/PVC** para persistência do Redis
4. **Configurar monitoring** com Prometheus/Grafana
5. **Configurar CI/CD** pipeline
