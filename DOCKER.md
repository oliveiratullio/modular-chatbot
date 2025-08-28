# Docker Setup

Este projeto inclui configuração completa do Docker para desenvolvimento e produção.

## Pré-requisitos

- Docker
- Docker Compose
- Make (opcional, mas recomendado)

## Configuração Inicial

### Opção 1: Script automático (recomendado)

```bash
# Executar script de configuração
chmod +x setup-docker.sh
./setup-docker.sh
```

### Opção 2: Configuração manual

1. Copie o arquivo de exemplo de variáveis de ambiente:

```bash
cp env.example .env
```

2. Configure suas variáveis de ambiente no arquivo `.env`:

```bash
# Edite o arquivo .env e configure sua OpenAI API Key
OPENAI_API_KEY=your_actual_openai_api_key_here
```

## Comandos Disponíveis

### Usando Make (recomendado)

```bash
# Subir todos os serviços
make docker-up

# Parar todos os serviços
make docker-down

# Rebuild das imagens
make docker-build

# Ver logs
make docker-logs

# Limpar tudo (volumes, containers, imagens)
make docker-clean
```

### Usando Docker Compose diretamente

```bash
# Subir todos os serviços
docker-compose up -d

# Parar todos os serviços
docker-compose down

# Rebuild das imagens
docker-compose build --no-cache

# Ver logs
docker-compose logs -f

# Ver logs de um serviço específico
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f redis
```

## Serviços

### Redis (Porta 6379)

- Banco de dados em memória para cache e sessões
- Health check configurado
- Dados persistidos em volume

### Backend (Porta 8080)

- API NestJS com Fastify
- Usuário não-root (nestjs:1001)
- Health check em `/health`
- Rate limiting configurado
- CORS habilitado

### Frontend (Porta 5173)

- Aplicação React com Vite
- Servido por Nginx
- Usuário não-root (nginx-user:1001)
- SPA routing configurado
- Gzip compression
- Security headers

## URLs de Acesso

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8080
- **Backend Health**: http://localhost:8080/health
- **Frontend Health**: http://localhost:5173/health

## Health Checks

Todos os serviços incluem health checks configurados:

- **Redis**: Ping command
- **Backend**: HTTP GET /health
- **Frontend**: HTTP GET /health

## Volumes

- `redis_data`: Dados persistentes do Redis

## Networks

- `chatbot-network`: Rede interna para comunicação entre serviços

## Troubleshooting

### Verificar status dos serviços

```bash
docker-compose ps
```

### Verificar logs de erro

```bash
docker-compose logs backend
docker-compose logs frontend
docker-compose logs redis
```

### Rebuild específico

```bash
# Rebuild apenas o backend
docker-compose build backend

# Rebuild apenas o frontend
docker-compose build frontend
```

### Acessar container

```bash
# Acessar backend
docker-compose exec backend sh

# Acessar frontend
docker-compose exec frontend sh

# Acessar redis
docker-compose exec redis redis-cli
```

## Desenvolvimento

Para desenvolvimento local sem Docker, use:

```bash
# Instalar dependências
pnpm install

# Backend
cd packages/backend
pnpm dev

# Frontend (em outro terminal)
cd packages/frontend
pnpm dev
```

## Produção

Para produção, certifique-se de:

1. Configurar todas as variáveis de ambiente
2. Usar secrets management adequado
3. Configurar SSL/TLS
4. Configurar backup do Redis
5. Monitoramento e logging adequados
