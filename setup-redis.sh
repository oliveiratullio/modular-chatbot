#!/bin/bash

# Script para configurar Redis com dados populados

echo "🔧 Configurando Redis para Modular Chatbot..."

# Verificar se o arquivo .env existe
if [ ! -f ".env" ]; then
    echo "❌ Arquivo .env não encontrado. Execute primeiro:"
    echo "   cp env.example .env"
    exit 1
fi

echo ""
echo "📝 Configure o REDIS_URL no arquivo .env:"
echo ""
echo "   # Para usar Redis local (sem dados):"
echo "   REDIS_URL=redis://localhost:6379"
echo ""
echo "   # Para usar Redis online com dados:"
echo "   REDIS_URL=redis://your-redis-server:6379"
echo "   # ou"
echo "   REDIS_URL=redis://username:password@your-redis-server:6379"
echo ""
echo "🔍 Verifique se o Redis está acessível:"
echo "   redis-cli -u \$REDIS_URL ping"
echo ""
echo "📚 Para popular o Redis com dados, use:"
echo "   cd packages/backend"
echo "   pnpm ingest:local"
echo ""
echo "🚀 Para iniciar com Docker:"
echo "   make docker-up"
echo ""
echo "✅ Configuração concluída!"
