@echo off
REM Script para deploy no Kubernetes (Windows)

echo 🚀 Deploying Modular Chatbot to Kubernetes...

REM Verificar se kubectl está disponível
kubectl version --client >nul 2>&1
if errorlevel 1 (
    echo ❌ kubectl não encontrado. Instale o kubectl primeiro.
    exit /b 1
)

REM Verificar se o cluster está acessível
kubectl cluster-info >nul 2>&1
if errorlevel 1 (
    echo ❌ Não foi possível conectar ao cluster Kubernetes.
    echo    Verifique se o kubectl está configurado corretamente.
    exit /b 1
)

echo ✅ Cluster Kubernetes acessível

REM Aplicar manifests na ordem correta
echo 📦 Aplicando manifests...

echo 1. Namespace...
kubectl apply -f namespace.yaml

echo 2. ConfigMap...
kubectl apply -f configmap.yaml

echo 3. Secret...
kubectl apply -f secret.yaml

echo 4. Redis...
kubectl apply -f redis.yaml

echo 5. Backend...
kubectl apply -f backend.yaml

echo 6. Frontend...
kubectl apply -f frontend.yaml

echo 7. Ingress...
kubectl apply -f ingress.yaml

echo.
echo ⏳ Aguardando pods ficarem prontos...
kubectl wait --for=condition=ready pod -l app=modular-chatbot -n app --timeout=300s

echo.
echo ✅ Deploy concluído!
echo.
echo 📊 Status dos recursos:
echo ========================
kubectl get pods,svc,ing -n app

echo.
echo 🌐 URLs de acesso:
echo ==================
echo Frontend: http://modular-chatbot.local
echo Backend API: http://modular-chatbot.local/api
echo Health Check: http://modular-chatbot.local/api/health

echo.
echo 🔍 Para ver logs:
echo =================
echo kubectl logs -f deployment/backend -n app
echo kubectl logs -f deployment/frontend -n app
echo kubectl logs -f deployment/redis -n app

echo.
echo 📝 Para editar configurações:
echo =============================
echo kubectl edit configmap app-config -n app
echo kubectl edit secret app-secrets -n app

echo.
echo 🗑️  Para remover tudo:
echo =====================
echo kubectl delete namespace app
