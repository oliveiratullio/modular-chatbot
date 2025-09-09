#!/bin/bash

# Script para deploy do Modular Chatbot no Kubernetes
set -e

echo "🚀 Iniciando deploy do Modular Chatbot no Kubernetes..."

# Verificar se o kubectl está instalado
if ! command -v kubectl &> /dev/null; then
    echo "❌ kubectl não encontrado. Por favor, instale o kubectl primeiro."
    exit 1
fi

# Verificar se o cluster está acessível
if ! kubectl cluster-info &> /dev/null; then
    echo "❌ Não foi possível conectar ao cluster Kubernetes."
    exit 1
fi

echo "✅ Cluster Kubernetes acessível"

# Criar namespace
echo "📦 Criando namespace..."
kubectl apply -f k8s/namespace.yaml

# Aplicar ConfigMap e Secret
echo "🔧 Aplicando ConfigMap e Secret..."
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/secret.yaml

# Deploy Redis
echo "🔴 Deployando Redis..."
kubectl apply -f k8s/redis.yaml

# Aguardar Redis estar pronto
echo "⏳ Aguardando Redis estar pronto..."
kubectl wait --for=condition=ready pod -l app=modular-chatbot-redis -n modular-chatbot --timeout=300s

# Deploy Backend
echo "🔵 Deployando Backend..."
kubectl apply -f k8s/backend.yaml

# Aguardar Backend estar pronto
echo "⏳ Aguardando Backend estar pronto..."
kubectl wait --for=condition=ready pod -l app=modular-chatbot-backend -n modular-chatbot --timeout=300s

# Deploy Frontend
echo "🟢 Deployando Frontend..."
kubectl apply -f k8s/frontend.yaml

# Aguardar Frontend estar pronto
echo "⏳ Aguardando Frontend estar pronto..."
kubectl wait --for=condition=ready pod -l app=modular-chatbot-frontend -n modular-chatbot --timeout=300s

# Deploy Ingress
echo "🌐 Deployando Ingress..."
kubectl apply -f k8s/ingress.yaml

echo "✅ Deploy concluído com sucesso!"
echo ""
echo "📊 Status dos pods:"
kubectl get pods -n modular-chatbot

echo ""
echo "🌐 Serviços:"
kubectl get services -n modular-chatbot

echo ""
echo "🔗 Para acessar a aplicação:"
echo "   - Frontend: http://localhost (se LoadBalancer estiver configurado)"
echo "   - Backend API: http://localhost/api"
echo ""
echo "📝 Para ver logs:"
echo "   - Backend: kubectl logs -f deployment/modular-chatbot-backend -n modular-chatbot"
echo "   - Frontend: kubectl logs -f deployment/modular-chatbot-frontend -n modular-chatbot"
echo "   - Redis: kubectl logs -f deployment/modular-chatbot-redis -n modular-chatbot"
