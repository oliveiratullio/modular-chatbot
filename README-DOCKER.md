# 🐳 Docker Setup - Modular Chatbot

## 🚀 Início Rápido

1. **Configure as variáveis de ambiente:**

   ```bash
   # Configure o arquivo packages/backend/.env com suas variáveis
   # Configure o arquivo packages/frontend/.env se necessário
   ```

2. **Inicie os serviços:**

   ```bash
   make docker-up
   ```

3. **Acesse a aplicação:**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:8080
   - Health Check: http://localhost:8080/health

## 📋 Comandos Úteis

```bash
# Subir serviços
make docker-up

# Parar serviços
make docker-down

# Ver logs
make docker-logs

# Rebuild imagens
make docker-build

# Limpar tudo
make docker-clean
```

## 🔧 Serviços

- **Redis** (6379): Cache e sessões
- **Backend** (8080): API NestJS
- **Frontend** (5173): React + Nginx

## 📝 Variáveis de Ambiente

### Backend (packages/backend/.env)

Configure no arquivo `packages/backend/.env`:

- `OPENAI_API_KEY`: Sua chave da OpenAI (obrigatório)
- `REDIS_URL`: URL do Redis (use seu Redis online com dados populados)
- `REDIS_NAMESPACE`: Namespace do Redis (padrão: rag)
- `PORT`: Porta do backend

### Frontend (packages/frontend/.env)

Configure no arquivo `packages/frontend/.env` se necessário:

- `VITE_API_URL`: URL da API para o frontend

### 🔧 Configuração do Redis

Para usar seu Redis online com dados populados:

1. **Configure o REDIS_URL no packages/backend/.env:**

   ```bash
   REDIS_URL=redis://your-redis-server:6379
   # ou com autenticação:
   REDIS_URL=redis://username:password@your-redis-server:6379
   ```

2. **Teste a conexão:**

   ```bash
   redis-cli -u $REDIS_URL ping
   ```

3. **Para popular dados localmente:**
   ```bash
   cd packages/backend
   pnpm ingest:local
   ```

## 🐛 Troubleshooting

Se houver problemas:

1. **Verificar logs:**

   ```bash
   docker-compose logs backend
   docker-compose logs frontend
   ```

2. **Rebuild específico:**

   ```bash
   docker-compose build backend
   docker-compose build frontend
   ```

3. **Limpar cache:**
   ```bash
   make docker-clean
   ```

## 📚 Documentação Completa

Veja `DOCKER.md` para documentação detalhada.
