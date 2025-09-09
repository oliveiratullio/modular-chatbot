
# Script para construir as imagens Docker para Kubernetes (PowerShell)

Write-Host "🔨 Construindo imagens Docker para Kubernetes..." -ForegroundColor Yellow

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
Write-Host ""
Write-Host "📦 Imagens disponíveis:" -ForegroundColor Yellow
docker images | Select-String "modular-chatbot"

Write-Host ""
Write-Host "🚀 Para fazer deploy no Kubernetes:" -ForegroundColor Cyan
Write-Host "   .\k8s\deploy.ps1" -ForegroundColor White
