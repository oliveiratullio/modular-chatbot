# Script para remover o Modular Chatbot do Kubernetes (PowerShell)

Write-Host "🗑️  Removendo Modular Chatbot do Kubernetes..." -ForegroundColor Yellow

# Verificar se o kubectl está instalado
try {
    kubectl version --client | Out-Null
} catch {
    Write-Host "❌ kubectl não encontrado. Por favor, instale o kubectl primeiro." -ForegroundColor Red
    exit 1
}

# Remover Ingress
Write-Host "🌐 Removendo Ingress..." -ForegroundColor Cyan
kubectl delete -f k8s/ingress.yaml --ignore-not-found=true

# Remover Frontend
Write-Host "🟢 Removendo Frontend..." -ForegroundColor Green
kubectl delete -f k8s/frontend.yaml --ignore-not-found=true

# Remover Backend
Write-Host "🔵 Removendo Backend..." -ForegroundColor Blue
kubectl delete -f k8s/backend.yaml --ignore-not-found=true

# Remover Redis
Write-Host "🔴 Removendo Redis..." -ForegroundColor Red
kubectl delete -f k8s/redis.yaml --ignore-not-found=true

# Remover ConfigMap e Secret
Write-Host "🔧 Removendo ConfigMap e Secret..." -ForegroundColor Yellow
kubectl delete -f k8s/configmap.yaml --ignore-not-found=true
kubectl delete -f k8s/secret.yaml --ignore-not-found=true

# Remover namespace (isso remove tudo dentro dele)
Write-Host "📦 Removendo namespace..." -ForegroundColor Yellow
kubectl delete namespace modular-chatbot --ignore-not-found=true

Write-Host "✅ Remoção concluída com sucesso!" -ForegroundColor Green
