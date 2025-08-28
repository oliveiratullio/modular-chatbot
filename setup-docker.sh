#!/bin/bash

# Script para configurar o Docker do Modular Chatbot

echo "🚀 Configurando Docker para Modular Chatbot..."

# Verificar se o arquivo .env já existe
if [ -f ".env" ]; then
    echo "⚠️  Arquivo .env já existe. Deseja sobrescrever? (y/N)"
    read -r response
    if [[ ! "$response" =~ ^[Yy]$ ]]; then
        echo "❌ Configuração cancelada."
        exit 1
    fi
fi

# Copiar arquivo de exemplo
cp env.example .env

echo "✅ Arquivo .env criado com sucesso!"
echo ""
echo "📝 IMPORTANTE: Edite o arquivo .env e configure sua OpenAI API Key:"
echo "   OPENAI_API_KEY=your_actual_openai_api_key_here"
echo ""
echo "🔧 Para iniciar os serviços, execute:"
echo "   make docker-up"
echo "   ou"
echo "   docker-compose up -d"
echo ""
echo "🌐 URLs de acesso:"
echo "   Frontend: http://localhost:5173"
echo "   Backend API: http://localhost:8080"
echo "   Backend Health: http://localhost:8080/health"
echo ""
echo "📚 Para mais informações, consulte o arquivo DOCKER.md"
