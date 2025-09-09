#!/bin/bash

# Script para construir as imagens Docker para Kubernetes
set -e

echo "🔨 Construindo imagens Docker para Kubernetes..."

# Verificar se o Docker está rodando
if ! docker info &> /dev/null; then
    echo "❌ Docker não está rodando. Por favor, inicie o Docker primeiro."
    exit 1
fi

# Construir imagem do Backend
echo "🔵 Construindo imagem do Backend..."
docker build -f packages/backend/Dockerfile -t modular-chatbot-backend:latest .

# Construir imagem do Frontend
echo "🟢 Construindo imagem do Frontend..."
docker build -f packages/frontend/Dockerfile -t modular-chatbot-frontend:latest .

echo "✅ Imagens construídas com sucesso!"
echo ""
echo "📦 Imagens disponíveis:"
docker images | grep modular-chatbot

echo ""
echo "🚀 Para fazer deploy no Kubernetes:"
echo "   ./k8s/deploy.sh"
