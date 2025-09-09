# 🚀 Kubernetes Deployment Guide - Modular Chatbot

Este guia fornece instruções completas para implantar o Modular Chatbot no Kubernetes.

## 📋 Visão Geral

O projeto agora inclui configuração completa do Kubernetes com:

- **Namespace isolado** para todos os recursos
- **Deployments** para Backend, Frontend e Redis
- **Services** para comunicação interna
- **Ingress** para exposição externa
- **ConfigMaps e Secrets** para configuração
- **Scripts automatizados** para deploy e remoção
- **Suporte a Helm** (opcional)

## 🏗️ Estrutura dos Arquivos

```
k8s/
├── namespace.yaml              # Namespace dedicado
├── configmap.yaml              # Configurações da aplicação
├── secret.yaml                 # Secrets (chaves de API)
├── secret.example.yaml         # Exemplo de secrets
├── redis.yaml                  # Deployment e Service do Redis
├── backend.yaml                # Deployment e Service do Backend
├── frontend.yaml               # Deployment e Service do Frontend
├── ingress.yaml                # Ingress para exposição externa
├── deploy.sh                   # Script de deploy (Linux/Mac)
├── deploy.ps1                  # Script de deploy (Windows)
├── undeploy.sh                 # Script de remoção (Linux/Mac)
├── undeploy.ps1                # Script de remoção (Windows)
├── build-images.sh             # Script para construir imagens (Linux/Mac)
├── build-images.ps1            # Script para construir imagens (Windows)
├── minikube-setup.ps1          # Configuração do Minikube (Windows)
├── README.md                   # Documentação detalhada
└── helm/                       # Chart do Helm (opcional)
    ├── Chart.yaml
    └── values.yaml
```

## 🚀 Deploy Rápido

### 1. Configurar Secrets

Antes de fazer o deploy, configure os secrets:

```bash
# Copie o arquivo de exemplo
cp k8s/secret.example.yaml k8s/secret.yaml

# Edite com suas chaves reais
# Use os comandos abaixo para gerar valores base64:
echo -n "sua-openai-api-key" | base64
echo -n "sua-redis-password" | base64
```

### 2. Deploy Automatizado (Recomendado)

#### Windows (PowerShell):

```powershell
# Construir imagens
.\k8s\build-images.ps1

# Fazer deploy
.\k8s\deploy.ps1
```

#### Linux/Mac:

```bash
# Tornar scripts executáveis
chmod +x k8s/*.sh

# Construir imagens
./k8s/build-images.sh

# Fazer deploy
./k8s/deploy.sh
```

### 3. Deploy Manual

```bash
# Aplicar todos os recursos
kubectl apply -f k8s/

# Verificar status
kubectl get pods,svc,ing -n modular-chatbot
```

## 🔧 Configurações Detalhadas

### Namespace

- **Nome**: `modular-chatbot`
- **Isolamento**: Todos os recursos ficam isolados neste namespace

### Backend (NestJS)

- **Réplicas**: 2 (alta disponibilidade)
- **Porta**: 8080
- **Recursos**: 256Mi-512Mi RAM, 200m-500m CPU
- **Health Checks**: `/health` e `/ready`
- **Dependências**: Redis

### Frontend (React)

- **Réplicas**: 2 (alta disponibilidade)
- **Porta**: 5173 (mapeada para 80)
- **Recursos**: 128Mi-256Mi RAM, 100m-200m CPU
- **Health Checks**: `/`
- **Dependências**: Backend

### Redis

- **Réplicas**: 1
- **Porta**: 6379
- **Storage**: PersistentVolumeClaim (1Gi)
- **Health Checks**: Redis ping
- **Persistência**: Dados mantidos entre restarts

### Ingress

- **Controller**: NGINX
- **Host**: `chatbot.local`
- **Paths**:
  - `/` → Frontend
  - `/api` → Backend
- **CORS**: Configurado para desenvolvimento

## 🌐 Acesso à Aplicação

### Opção 1: LoadBalancer

```bash
kubectl get service modular-chatbot-frontend-lb -n modular-chatbot
```

### Opção 2: Port Forward

```bash
# Frontend
kubectl port-forward service/modular-chatbot-frontend 8080:80 -n modular-chatbot

# Backend
kubectl port-forward service/modular-chatbot-backend 8081:8080 -n modular-chatbot
```

### Opção 3: Ingress

1. Instalar NGINX Ingress Controller
2. Adicionar `127.0.0.1 chatbot.local` ao `/etc/hosts`
3. Acessar `http://chatbot.local`

## 🛠️ Desenvolvimento Local

### Minikube (Windows)

```powershell
# Configurar Minikube
.\k8s\minikube-setup.ps1

# Seguir passos do deploy normal
```

### Docker Desktop Kubernetes

1. Habilitar Kubernetes no Docker Desktop
2. Seguir passos do deploy normal

## 📊 Monitoramento

### Status dos Recursos

```bash
# Pods
kubectl get pods -n modular-chatbot

# Serviços
kubectl get services -n modular-chatbot

# Deployments
kubectl get deployments -n modular-chatbot

# Ingress
kubectl get ingress -n modular-chatbot
```

### Logs

```bash
# Backend
kubectl logs -f deployment/modular-chatbot-backend -n modular-chatbot

# Frontend
kubectl logs -f deployment/modular-chatbot-frontend -n modular-chatbot

# Redis
kubectl logs -f deployment/modular-chatbot-redis -n modular-chatbot
```

### Descrever Recursos

```bash
# Pods
kubectl describe pods -l app=modular-chatbot-backend -n modular-chatbot

# Serviços
kubectl describe service modular-chatbot-backend -n modular-chatbot

# Events
kubectl get events -n modular-chatbot --sort-by='.lastTimestamp'
```

## 🔄 Atualizações

### Atualizar Imagens

```bash
# Construir novas imagens
.\k8s\build-images.ps1

# Reiniciar deployments
kubectl rollout restart deployment/modular-chatbot-backend -n modular-chatbot
kubectl rollout restart deployment/modular-chatbot-frontend -n modular-chatbot

# Verificar status
kubectl rollout status deployment/modular-chatbot-backend -n modular-chatbot
```

### Atualizar Configurações

```bash
# Aplicar novas configurações
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/secret.yaml

# Reiniciar pods para aplicar mudanças
kubectl rollout restart deployment/modular-chatbot-backend -n modular-chatbot
```

## 🗑️ Remoção

### Remoção Completa

```powershell
# Windows
.\k8s\undeploy.ps1

# Linux/Mac
./k8s/undeploy.sh
```

### Remoção Manual

```bash
# Remover recursos específicos
kubectl delete -f k8s/ingress.yaml
kubectl delete -f k8s/frontend.yaml
kubectl delete -f k8s/backend.yaml
kubectl delete -f k8s/redis.yaml
kubectl delete -f k8s/configmap.yaml
kubectl delete -f k8s/secret.yaml
kubectl delete namespace modular-chatbot
```

## 🚨 Troubleshooting

### Pods não iniciam

```bash
# Verificar eventos
kubectl get events -n modular-chatbot --sort-by='.lastTimestamp'

# Verificar logs de inicialização
kubectl logs deployment/modular-chatbot-backend -n modular-chatbot --previous

# Verificar descrição do pod
kubectl describe pod -l app=modular-chatbot-backend -n modular-chatbot
```

### Problemas de conectividade

```bash
# Testar conectividade entre pods
kubectl exec -it deployment/modular-chatbot-backend -n modular-chatbot -- wget -qO- http://modular-chatbot-redis:6379

# Verificar DNS
kubectl exec -it deployment/modular-chatbot-backend -n modular-chatbot -- nslookup modular-chatbot-redis
```

### Problemas de recursos

```bash
# Verificar uso de recursos
kubectl top pods -n modular-chatbot
kubectl top nodes

# Verificar limites
kubectl describe pod -l app=modular-chatbot-backend -n modular-chatbot | grep -A 10 "Limits:"
```

## 🔧 Helm (Opcional)

### Instalar com Helm

```bash
# Instalar chart
helm install modular-chatbot k8s/helm/

# Atualizar
helm upgrade modular-chatbot k8s/helm/

# Desinstalar
helm uninstall modular-chatbot
```

### Personalizar valores

```bash
# Criar arquivo de valores personalizado
cp k8s/helm/values.yaml my-values.yaml

# Editar valores
# Instalar com valores personalizados
helm install modular-chatbot k8s/helm/ -f my-values.yaml
```

## 📝 Notas Importantes

1. **Secrets**: Sempre configure os secrets antes do deploy
2. **Imagens**: As imagens devem estar disponíveis no cluster
3. **Storage**: O Redis usa PersistentVolumeClaim
4. **Ingress**: Requer NGINX Ingress Controller
5. **Recursos**: Ajuste limites conforme necessário
6. **Ambiente**: Use Minikube para desenvolvimento local

## 🔗 Links Úteis

- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [NGINX Ingress Controller](https://kubernetes.github.io/ingress-nginx/)
- [Minikube](https://minikube.sigs.k8s.io/)
- [Helm](https://helm.sh/)
- [Docker Desktop Kubernetes](https://docs.docker.com/desktop/kubernetes/)

## 🎯 Próximos Passos

1. Configure os secrets com suas chaves reais
2. Escolha um método de deploy (automatizado ou manual)
3. Execute o deploy
4. Verifique o status dos recursos
5. Acesse a aplicação
6. Monitore logs e performance

---

**🎉 Parabéns! Seu Modular Chatbot está rodando no Kubernetes!**
