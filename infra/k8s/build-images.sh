#!/bin/bash

# Script para build e push das imagens Docker

set -e

REGISTRY=${REGISTRY:-"localhost:5000"}
IMAGE_TAG=${IMAGE_TAG:-"latest"}

echo "🐳 Building and pushing Docker images..."
echo "Registry: $REGISTRY"
echo "Tag: $IMAGE_TAG"

# Build backend image
echo "📦 Building backend image..."
docker build -f packages/backend/Dockerfile -t $REGISTRY/modular-chatbot-backend:$IMAGE_TAG .

# Build frontend image
echo "📦 Building frontend image..."
docker build -f packages/frontend/Dockerfile -t $REGISTRY/modular-chatbot-frontend:$IMAGE_TAG .

# Push images (if not local registry)
if [[ "$REGISTRY" != "localhost:5000" ]]; then
    echo "📤 Pushing images to registry..."
    docker push $REGISTRY/modular-chatbot-backend:$IMAGE_TAG
    docker push $REGISTRY/modular-chatbot-frontend:$IMAGE_TAG
else
    echo "ℹ️  Skipping push for local registry"
fi

echo "✅ Images built successfully!"
echo ""
echo "📝 Update the image names in the Kubernetes manifests:"
echo "   - infra/k8s/backend.yaml: modular-chatbot-backend:$IMAGE_TAG"
echo "   - infra/k8s/frontend.yaml: modular-chatbot-frontend:$IMAGE_TAG"
