#!/bin/bash

# Exemplos de chamadas para a API do Modular Chatbot
# Base URL: http://localhost:8080

echo "🤖 Modular Chatbot - Exemplos de API"
echo "====================================="

# Health Check
echo ""
echo "1. Health Check:"
echo "curl http://localhost:8080/health"
curl -s http://localhost:8080/health | jq '.'

# Chat - Pergunta Matemática
echo ""
echo "2. Chat - Pergunta Matemática:"
echo 'curl -X POST http://localhost:8080/chat -H "Content-Type: application/json" -d '"'"'{"message": "Quanto é 15 * 3?", "userId": "user123"}'"'"
curl -s -X POST http://localhost:8080/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Quanto é 15 * 3?", "userId": "user123"}' | jq '.'

# Chat - Pergunta de Conhecimento
echo ""
echo "3. Chat - Pergunta de Conhecimento:"
echo 'curl -X POST http://localhost:8080/chat -H "Content-Type: application/json" -d '"'"'{"message": "O que é inteligência artificial?", "userId": "user123"}'"'"
curl -s -X POST http://localhost:8080/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "O que é inteligência artificial?", "userId": "user123"}' | jq '.'

# Chat - Expressão Complexa
echo ""
echo "4. Chat - Expressão Matemática Complexa:"
echo 'curl -X POST http://localhost:8080/chat -H "Content-Type: application/json" -d '"'"'{"message": "Calcule (25 + 15) / 4 + 7 * 2", "userId": "user123"}'"'"
curl -s -X POST http://localhost:8080/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Calcule (25 + 15) / 4 + 7 * 2", "userId": "user123"}' | jq '.'

# Chat - Pergunta Geral
echo ""
echo "5. Chat - Pergunta Geral:"
echo 'curl -X POST http://localhost:8080/chat -H "Content-Type: application/json" -d '"'"'{"message": "Como você funciona?", "userId": "user123"}'"'"
curl -s -X POST http://localhost:8080/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Como você funciona?", "userId": "user123"}' | jq '.'

# Teste de Rate Limiting
echo ""
echo "6. Teste de Rate Limiting (múltiplas requisições):"
for i in {1..5}; do
  echo "Requisição $i:"
  curl -s -X POST http://localhost:8080/chat \
    -H "Content-Type: application/json" \
    -d "{\"message\": \"Teste $i\", \"userId\": \"user123\"}" | jq '.message // .error'
  sleep 0.5
done

echo ""
echo "✅ Exemplos concluídos!"
echo ""
echo "📝 Notas:"
echo "- Certifique-se de que o backend está rodando em http://localhost:8080"
echo "- Instale o 'jq' para formatação JSON: brew install jq (Mac) ou apt install jq (Linux)"
echo "- Para Windows, use o PowerShell ou WSL para executar estes comandos"
