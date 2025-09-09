# Script para deploy do Modular Chatbot no Kubernetes (PowerShell)
param(
    [switch]$SkipBuild
)

Write-Host "🚀 Iniciando deploy do Modular Chatbot no Kubernetes..." -ForegroundColor Green

# Verificar se o kubectl está instalado
try {
    kubectl version --client | Out-Null
} catch {
    Write-Host "❌ kubectl não encontrado. Por favor, instale o kubectl primeiro." -ForegroundColor Red
    exit 1
}

# Verificar se o cluster está acessível
try {
    kubectl cluster-info | Out-Null
} catch {
    Write-Host "❌ Não foi possível conectar ao cluster Kubernetes." -ForegroundColor Red
    exit 1
}

Write-Host "✅ Cluster Kubernetes acessível" -ForegroundColor Green

# Construir imagens se não for pulado
if (-not $SkipBuild) {
    Write-Host "🔨 Construindo imagens Docker..." -ForegroundColor Yellow
    
    # Verificar se o Docker está rodando
    try {
        docker info | Out-Null
    } catch {
        Write-Host "❌ Docker não está rodando. Por favor, inicie o Docker primeiro." -ForegroundColor Red
        exit 1
    }
    
    # Construir imagem do Backend
    Write-Host "🔵 Construindo imagem do Backend..." -ForegroundColor Blue
    docker build -f packages/backend/Dockerfile -t modular-chatbot-backend:latest .
    
    # Construir imagem do Frontend
    Write-Host "🟢 Construindo imagem do Frontend..." -ForegroundColor Green
    docker build -f packages/frontend/Dockerfile -t modular-chatbot-frontend:latest .
    
    Write-Host "✅ Imagens construídas com sucesso!" -ForegroundColor Green
}

# Criar namespace
Write-Host "📦 Criando namespace..." -ForegroundColor Yellow
kubectl apply -f k8s/namespace.yaml

# Aplicar ConfigMap e Secret
Write-Host "🔧 Aplicando ConfigMap e Secret..." -ForegroundColor Yellow
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/secret.yaml

# Deploy Redis
Write-Host "🔴 Deployando Redis..." -ForegroundColor Red
kubectl apply -f k8s/redis.yaml

# Aguardar Redis estar pronto
Write-Host "⏳ Aguardando Redis estar pronto..." -ForegroundColor Yellow
kubectl wait --for=condition=ready pod -l app=modular-chatbot-redis -n modular-chatbot --timeout=300s

# Deploy Backend
Write-Host "🔵 Deployando Backend..." -ForegroundColor Blue
kubectl apply -f k8s/backend.yaml

# Aguardar Backend estar pronto
Write-Host "⏳ Aguardando Backend estar pronto..." -ForegroundColor Yellow
kubectl wait --for=condition=ready pod -l app=modular-chatbot-backend -n modular-chatbot --timeout=300s

# Deploy Frontend
Write-Host "🟢 Deployando Frontend..." -ForegroundColor Green
kubectl apply -f k8s/frontend.yaml

# Aguardar Frontend estar pronto
Write-Host "⏳ Aguardando Frontend estar pronto..." -ForegroundColor Yellow
kubectl wait --for=condition=ready pod -l app=modular-chatbot-frontend -n modular-chatbot --timeout=300s

# Deploy Ingress
Write-Host "🌐 Deployando Ingress..." -ForegroundColor Cyan
kubectl apply -f k8s/ingress.yaml

Write-Host "✅ Deploy concluído com sucesso!" -ForegroundColor Green
Write-Host ""
Write-Host "📊 Status dos pods:" -ForegroundColor Yellow
kubectl get pods -n modular-chatbot

Write-Host ""
Write-Host "🌐 Serviços:" -ForegroundColor Yellow
kubectl get services -n modular-chatbot

Write-Host ""
Write-Host "🔗 Para acessar a aplicação:" -ForegroundColor Cyan
Write-Host "   - Frontend: http://localhost (se LoadBalancer estiver configurado)" -ForegroundColor White
Write-Host "   - Backend API: http://localhost/api" -ForegroundColor White
Write-Host ""
Write-Host "📝 Para ver logs:" -ForegroundColor Cyan
Write-Host "   - Backend: kubectl logs -f deployment/modular-chatbot-backend -n modular-chatbot" -ForegroundColor White
Write-Host "   - Frontend: kubectl logs -f deployment/modular-chatbot-frontend -n modular-chatbot" -ForegroundColor White
Write-Host "   - Redis: kubectl logs -f deployment/modular-chatbot-redis -n modular-chatbot" -ForegroundColor White
