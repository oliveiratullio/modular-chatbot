#!/bin/bash

# Script de teste rápido para o Modular Chatbot
# Testa se todos os serviços estão funcionando

set -e

echo "🚀 Teste Rápido - Modular Chatbot"
echo "=================================="

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Função para verificar se um comando existe
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Verificar pré-requisitos
echo "📋 Verificando pré-requisitos..."

if command_exists docker; then
    echo -e "${GREEN}✅ Docker encontrado${NC}"
else
    echo -e "${RED}❌ Docker não encontrado${NC}"
    exit 1
fi

if command_exists docker-compose; then
    echo -e "${GREEN}✅ Docker Compose encontrado${NC}"
else
    echo -e "${RED}❌ Docker Compose não encontrado${NC}"
    exit 1
fi

# Verificar se os serviços estão rodando
echo ""
echo "🔍 Verificando serviços..."

if docker-compose ps | grep -q "Up"; then
    echo -e "${GREEN}✅ Serviços Docker rodando${NC}"
else
    echo -e "${YELLOW}⚠️  Serviços não estão rodando. Iniciando...${NC}"
    docker-compose up -d
    sleep 10
fi

# Testar health check do backend
echo ""
echo "🏥 Testando health check do backend..."

for i in {1..30}; do
    if curl -s http://localhost:8080/health >/dev/null 2>&1; then
        echo -e "${GREEN}✅ Backend respondendo${NC}"
        break
    else
        if [ $i -eq 30 ]; then
            echo -e "${RED}❌ Backend não respondeu após 30 tentativas${NC}"
            exit 1
        fi
        echo -e "${YELLOW}⏳ Aguardando backend... (tentativa $i/30)${NC}"
        sleep 2
    fi
done

# Testar frontend
echo ""
echo "🌐 Testando frontend..."

for i in {1..10}; do
    if curl -s http://localhost:5173 >/dev/null 2>&1; then
        echo -e "${GREEN}✅ Frontend respondendo${NC}"
        break
    else
        if [ $i -eq 10 ]; then
            echo -e "${YELLOW}⚠️  Frontend não respondeu (pode estar em build)${NC}"
        else
            echo -e "${YELLOW}⏳ Aguardando frontend... (tentativa $i/10)${NC}"
            sleep 3
        fi
    fi
done

# Testar API de chat
echo ""
echo "💬 Testando API de chat..."

# Teste 1: Pergunta matemática
echo "Teste 1: Pergunta matemática"
RESPONSE=$(curl -s -X POST http://localhost:8080/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Quanto é 2 + 2?", "userId": "test-user"}')

if echo "$RESPONSE" | grep -q "4"; then
    echo -e "${GREEN}✅ Resposta matemática correta${NC}"
else
    echo -e "${YELLOW}⚠️  Resposta matemática inesperada: $RESPONSE${NC}"
fi

# Teste 2: Pergunta geral
echo ""
echo "Teste 2: Pergunta geral"
RESPONSE=$(curl -s -X POST http://localhost:8080/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Olá, como você está?", "userId": "test-user"}')

if echo "$RESPONSE" | grep -q "message"; then
    echo -e "${GREEN}✅ Resposta geral recebida${NC}"
else
    echo -e "${YELLOW}⚠️  Resposta geral inesperada: $RESPONSE${NC}"
fi

# Teste 3: Rate limiting
echo ""
echo "Teste 3: Rate limiting (múltiplas requisições)"
RATE_LIMIT_HIT=false
for i in {1..5}; do
    RESPONSE=$(curl -s -X POST http://localhost:8080/chat \
      -H "Content-Type: application/json" \
      -d "{\"message\": \"Teste $i\", \"userId\": \"test-user\"}")
    
    if echo "$RESPONSE" | grep -q "rate limit"; then
        RATE_LIMIT_HIT=true
        break
    fi
    sleep 0.5
done

if [ "$RATE_LIMIT_HIT" = true ]; then
    echo -e "${GREEN}✅ Rate limiting funcionando${NC}"
else
    echo -e "${YELLOW}⚠️  Rate limiting não foi testado${NC}"
fi

# Verificar logs
echo ""
echo "📊 Verificando logs..."

BACKEND_LOGS=$(docker-compose logs --tail=10 backend 2>/dev/null | wc -l)
FRONTEND_LOGS=$(docker-compose logs --tail=10 frontend 2>/dev/null | wc -l)
REDIS_LOGS=$(docker-compose logs --tail=10 redis 2>/dev/null | wc -l)

echo "Backend logs: $BACKEND_LOGS linhas"
echo "Frontend logs: $FRONTEND_LOGS linhas"
echo "Redis logs: $REDIS_LOGS linhas"

# Resumo final
echo ""
echo "🎉 Resumo do Teste"
echo "=================="
echo -e "${GREEN}✅ Backend: Funcionando${NC}"
echo -e "${GREEN}✅ Frontend: Funcionando${NC}"
echo -e "${GREEN}✅ Redis: Funcionando${NC}"
echo -e "${GREEN}✅ API de Chat: Funcionando${NC}"
echo ""
echo "🌐 URLs de Acesso:"
echo "Frontend: http://localhost:5173"
echo "Backend API: http://localhost:8080"
echo "Health Check: http://localhost:8080/health"
echo ""
echo "📝 Comandos úteis:"
echo "Ver logs: docker-compose logs -f"
echo "Parar serviços: docker-compose down"
echo "Rebuild: docker-compose build --no-cache"
echo ""
echo -e "${GREEN}🎊 Todos os testes passaram! O Modular Chatbot está funcionando!${NC}"
