# Script para configurar Minikube para o Modular Chatbot (PowerShell)

Write-Host "🚀 Configurando Minikube para Modular Chatbot..." -ForegroundColor Green

# Verificar se o Minikube está instalado
try {
    minikube version | Out-Null
} catch {
    Write-Host "❌ Minikube não encontrado. Instalando..." -ForegroundColor Yellow
    
    # Instalar Minikube via Chocolatey (se disponível)
    try {
        choco install minikube -y
    } catch {
        Write-Host "❌ Chocolatey não encontrado. Por favor, instale o Minikube manualmente:" -ForegroundColor Red
        Write-Host "   https://minikube.sigs.k8s.io/docs/start/" -ForegroundColor White
        exit 1
    }
}

# Verificar se o kubectl está instalado
try {
    kubectl version --client | Out-Null
} catch {
    Write-Host "❌ kubectl não encontrado. Instalando..." -ForegroundColor Yellow
    
    try {
        choco install kubernetes-cli -y
    } catch {
        Write-Host "❌ Chocolatey não encontrado. Por favor, instale o kubectl manualmente:" -ForegroundColor Red
        Write-Host "   https://kubernetes.io/docs/tasks/tools/install-kubectl/" -ForegroundColor White
        exit 1
    }
}

# Iniciar Minikube
Write-Host "🔧 Iniciando Minikube..." -ForegroundColor Yellow
minikube start --driver=hyperv --memory=4096 --cpus=2 --disk-size=20g

# Configurar Docker para usar o daemon do Minikube
Write-Host "🐳 Configurando Docker..." -ForegroundColor Yellow
minikube docker-env | Invoke-Expression

# Verificar status
Write-Host "✅ Verificando status do cluster..." -ForegroundColor Green
kubectl cluster-info
kubectl get nodes

Write-Host ""
Write-Host "🎉 Minikube configurado com sucesso!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Próximos passos:" -ForegroundColor Cyan
Write-Host "   1. Configure os secrets em k8s/secret.yaml" -ForegroundColor White
Write-Host "   2. Execute: .\k8s\build-images.ps1" -ForegroundColor White
Write-Host "   3. Execute: .\k8s\deploy.ps1" -ForegroundColor White
Write-Host ""
Write-Host "🔗 Para acessar o dashboard do Minikube:" -ForegroundColor Cyan
Write-Host "   minikube dashboard" -ForegroundColor White
