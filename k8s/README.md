# Kubernetes Deployment - Modular Chatbot

Este diretório contém todos os arquivos necessários para implantar o Modular Chatbot no Kubernetes.

## 📋 Pré-requisitos

- Kubernetes cluster (local ou remoto)
- kubectl configurado e conectado ao cluster
- Docker instalado e rodando
- NGINX Ingress Controller (opcional, para usar Ingress)

## 🏗️ Estrutura dos Arquivos

```
k8s/
├── namespace.yaml          # Namespace dedicado
├── configmap.yaml          # Configurações da aplicação
├── secret.yaml            # Secrets (chaves de API)
├── redis.yaml             # Deployment e Service do Redis
├── backend.yaml           # Deployment e Service do Backend
├── frontend.yaml          # Deployment e Service do Frontend
├── ingress.yaml           # Ingress para exposição externa
├── deploy.sh              # Script de deploy
├── undeploy.sh            # Script de remoção
├── build-images.sh        # Script para construir imagens
└── README.md              # Esta documentação
```

## 🚀 Deploy Rápido

### 1. Configurar Secrets

Antes de fazer o deploy, você precisa configurar os secrets no arquivo `secret.yaml`:

```bash
# Gerar valores base64 para suas chaves
echo -n "sua-openai-api-key" | base64
echo -n "sua-redis-password" | base64
```

Edite o arquivo `k8s/secret.yaml` e substitua os valores placeholder pelos seus valores reais.

### 2. Construir Imagens Docker

```bash
chmod +x k8s/build-images.sh
./k8s/build-images.sh
```

### 3. Fazer Deploy

```bash
chmod +x k8s/deploy.sh
./k8s/deploy.sh
```

## 🔧 Configuração Detalhada

### Namespace

Cria um namespace isolado `modular-chatbot` para todos os recursos da aplicação.

### ConfigMap

Contém as configurações não-sensíveis da aplicação:

- `NODE_ENV`: Ambiente de produção
- `PORT`: Porta do backend (8080)
- `REDIS_URL`: URL de conexão com Redis
- `REDIS_NAMESPACE`: Namespace do Redis para RAG
- `VITE_API_URL`: URL da API para o frontend

### Secret

Armazena informações sensíveis:

- `OPENAI_API_KEY`: Chave da API OpenAI
- `REDIS_PASSWORD`: Senha do Redis (se necessário)

### Redis

- **Deployment**: 1 réplica do Redis 7 Alpine
- **Service**: ClusterIP na porta 6379
- **Storage**: PersistentVolumeClaim de 1Gi
- **Health Checks**: Liveness e Readiness probes

### Backend

- **Deployment**: 2 réplicas para alta disponibilidade
- **Service**: ClusterIP na porta 8080
- **Resources**: 256Mi-512Mi RAM, 200m-500m CPU
- **Health Checks**: HTTP probes para `/health` e `/ready`

### Frontend

- **Deployment**: 2 réplicas para alta disponibilidade
- **Service**: ClusterIP na porta 80 (mapeia para 5173)
- **Resources**: 128Mi-256Mi RAM, 100m-200m CPU
- **Health Checks**: HTTP probes para `/`

### Ingress

Configuração do NGINX Ingress Controller:

- **Host**: `chatbot.local` (adicione ao seu `/etc/hosts`)
- **Paths**:
  - `/` → Frontend
  - `/api` → Backend
- **CORS**: Configurado para permitir requisições cross-origin

## 🌐 Acesso à Aplicação

### Opção 1: LoadBalancer (Recomendado para produção)

```bash
kubectl get service modular-chatbot-frontend-lb -n modular-chatbot
```

### Opção 2: Port Forward (Desenvolvimento)

```bash
# Frontend
kubectl port-forward service/modular-chatbot-frontend 8080:80 -n modular-chatbot

# Backend
kubectl port-forward service/modular-chatbot-backend 8081:8080 -n modular-chatbot
```

### Opção 3: Ingress (Requer NGINX Ingress Controller)

1. Instalar NGINX Ingress Controller:

```bash
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.8.2/deploy/static/provider/cloud/deploy.yaml
```

2. Adicionar ao `/etc/hosts`:

```
127.0.0.1 chatbot.local
```

3. Acessar: `http://chatbot.local`

## 📊 Monitoramento

### Verificar Status

```bash
# Status dos pods
kubectl get pods -n modular-chatbot

# Status dos serviços
kubectl get services -n modular-chatbot

# Status dos deployments
kubectl get deployments -n modular-chatbot
```

### Logs

```bash
# Backend logs
kubectl logs -f deployment/modular-chatbot-backend -n modular-chatbot

# Frontend logs
kubectl logs -f deployment/modular-chatbot-frontend -n modular-chatbot

# Redis logs
kubectl logs -f deployment/modular-chatbot-redis -n modular-chatbot
```

### Descrever Recursos

```bash
# Descrever pods
kubectl describe pods -l app=modular-chatbot-backend -n modular-chatbot

# Descrever serviços
kubectl describe service modular-chatbot-backend -n modular-chatbot
```

## 🗑️ Remoção

Para remover completamente a aplicação:

```bash
chmod +x k8s/undeploy.sh
./k8s/undeploy.sh
```

## 🔄 Atualizações

Para atualizar a aplicação:

1. Construir novas imagens:

```bash
./k8s/build-images.sh
```

2. Atualizar deployments:

```bash
kubectl rollout restart deployment/modular-chatbot-backend -n modular-chatbot
kubectl rollout restart deployment/modular-chatbot-frontend -n modular-chatbot
```

3. Verificar status:

```bash
kubectl rollout status deployment/modular-chatbot-backend -n modular-chatbot
kubectl rollout status deployment/modular-chatbot-frontend -n modular-chatbot
```

## 🚨 Troubleshooting

### Pods não iniciam

```bash
# Verificar eventos
kubectl get events -n modular-chatbot --sort-by='.lastTimestamp'

# Verificar logs de inicialização
kubectl logs deployment/modular-chatbot-backend -n modular-chatbot --previous
```

### Problemas de conectividade

```bash
# Testar conectividade entre pods
kubectl exec -it deployment/modular-chatbot-backend -n modular-chatbot -- wget -qO- http://modular-chatbot-redis:6379
```

### Problemas de recursos

```bash
# Verificar uso de recursos
kubectl top pods -n modular-chatbot
kubectl top nodes
```

## 📝 Notas Importantes

1. **Secrets**: Sempre configure os secrets antes do deploy
2. **Imagens**: As imagens devem estar disponíveis no cluster ou em um registry
3. **Storage**: O Redis usa PersistentVolumeClaim - certifique-se de que o cluster suporta
4. **Ingress**: Requer NGINX Ingress Controller instalado
5. **Recursos**: Ajuste os limites de CPU/memória conforme necessário

## 🔗 Links Úteis

- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [NGINX Ingress Controller](https://kubernetes.github.io/ingress-nginx/)
- [Docker Documentation](https://docs.docker.com/)
