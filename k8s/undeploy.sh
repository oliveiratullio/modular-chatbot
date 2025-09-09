#!/bin/bash

# Script para remover o Modular Chatbot do Kubernetes
set -e

echo "🗑️  Removendo Modular Chatbot do Kubernetes..."

# Verificar se o kubectl está instalado
if ! command -v kubectl &> /dev/null; then
    echo "❌ kubectl não encontrado. Por favor, instale o kubectl primeiro."
    exit 1
fi

# Remover Ingress
echo "🌐 Removendo Ingress..."
kubectl delete -f k8s/ingress.yaml --ignore-not-found=true

# Remover Frontend
echo "🟢 Removendo Frontend..."
kubectl delete -f k8s/frontend.yaml --ignore-not-found=true

# Remover Backend
echo "🔵 Removendo Backend..."
kubectl delete -f k8s/backend.yaml --ignore-not-found=true

# Remover Redis
echo "🔴 Removendo Redis..."
kubectl delete -f k8s/redis.yaml --ignore-not-found=true

# Remover ConfigMap e Secret
echo "🔧 Removendo ConfigMap e Secret..."
kubectl delete -f k8s/configmap.yaml --ignore-not-found=true
kubectl delete -f k8s/secret.yaml --ignore-not-found=true

# Remover namespace (isso remove tudo dentro dele)
echo "📦 Removendo namespace..."
kubectl delete namespace modular-chatbot --ignore-not-found=true

echo "✅ Remoção concluída com sucesso!"
