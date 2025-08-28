# ☁️ Deploy na Nuvem - Guia Completo

Este guia mostra como fazer deploy do Modular Chatbot em diferentes plataformas de nuvem.

## 🎯 Plataformas Suportadas

### 1. Render.com (Recomendado - Gratuito)

### 2. Railway

### 3. Vercel + Railway (Separação Frontend/Backend)

### 4. AWS ECS

### 5. Google Cloud Run

---

## 🚀 Render.com (Gratuito)

### Pré-requisitos

- Conta no [Render.com](https://render.com)
- Repositório GitHub público
- OpenAI API Key

### Passo a Passo

#### 1. Conectar Repositório

1. Acesse [dashboard.render.com](https://dashboard.render.com)
2. Clique em "New +" → "Web Service"
3. Conecte seu repositório GitHub
4. Selecione o repositório `modular-chatbot`

#### 2. Configurar Backend

```yaml
# render.yaml (criar na raiz do projeto)
services:
  - type: web
    name: modular-chatbot-backend
    env: node
    buildCommand: cd packages/backend && npm install && npm run build
    startCommand: cd packages/backend && npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 8080
      - key: OPENAI_API_KEY
        sync: false # Será configurado manualmente
      - key: REDIS_URL
        value: redis://your-redis-url:6379
```

#### 3. Configurar Variáveis de Ambiente

No dashboard do Render:

- `OPENAI_API_KEY`: Sua chave da OpenAI
- `REDIS_URL`: URL do seu Redis (pode usar Redis Cloud gratuito)
- `REDIS_NAMESPACE`: rag
- `RATE_LIMIT_MAX`: 120
- `RATE_LIMIT_WINDOW`: 60000

#### 4. Configurar Frontend

```yaml
# render.yaml (adicionar)
- type: web
  name: modular-chatbot-frontend
  env: static
  buildCommand: cd packages/frontend && npm install && npm run build
  staticPublishPath: packages/frontend/dist
  envVars:
    - key: VITE_API_URL
      value: https://modular-chatbot-backend.onrender.com
```

#### 5. Deploy Automático

- A cada push para `main`, o Render fará deploy automático
- URLs geradas: `https://modular-chatbot-backend.onrender.com`

---

## 🚂 Railway

### Pré-requisitos

- Conta no [Railway.app](https://railway.app)
- GitHub conectado

### Passo a Passo

#### 1. Importar Projeto

1. Acesse [railway.app](https://railway.app)
2. Clique em "New Project"
3. Selecione "Deploy from GitHub repo"
4. Escolha o repositório

#### 2. Configurar Serviços

Railway detectará automaticamente os serviços:

**Backend Service:**

- **Build Command**: `cd packages/backend && npm install && npm run build`
- **Start Command**: `cd packages/backend && npm start`
- **Port**: 8080

**Frontend Service:**

- **Build Command**: `cd packages/frontend && npm install && npm run build`
- **Start Command**: `cd packages/frontend && npm run preview`
- **Port**: 5173

#### 3. Configurar Variáveis

No painel do Railway:

```
OPENAI_API_KEY=sk-your-key-here
REDIS_URL=redis://your-redis-url:6379
NODE_ENV=production
VITE_API_URL=https://your-backend-url.railway.app
```

#### 4. Deploy

- Railway fará deploy automático
- URLs: `https://your-project.railway.app`

---

## ⚡ Vercel + Railway (Separação)

### Vercel (Frontend)

#### 1. Conectar ao Vercel

1. Acesse [vercel.com](https://vercel.com)
2. Importe o repositório
3. Configure o projeto:

```json
// vercel.json (na raiz)
{
  "buildCommand": "cd packages/frontend && npm install && npm run build",
  "outputDirectory": "packages/frontend/dist",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "https://your-backend-url.railway.app/api/$1"
    }
  ]
}
```

#### 2. Configurar Variáveis

```
VITE_API_URL=https://your-backend-url.railway.app
```

### Railway (Backend)

Siga os passos do Railway acima, mas apenas para o backend.

---

## ☁️ AWS ECS

### Pré-requisitos

- Conta AWS
- AWS CLI configurado
- Docker instalado

### Passo a Passo

#### 1. Criar ECR Repository

```bash
aws ecr create-repository --repository-name modular-chatbot-backend
aws ecr create-repository --repository-name modular-chatbot-frontend
```

#### 2. Build e Push das Imagens

```bash
# Login no ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin your-account.dkr.ecr.us-east-1.amazonaws.com

# Build e push do backend
docker build -f packages/backend/Dockerfile -t modular-chatbot-backend .
docker tag modular-chatbot-backend:latest your-account.dkr.ecr.us-east-1.amazonaws.com/modular-chatbot-backend:latest
docker push your-account.dkr.ecr.us-east-1.amazonaws.com/modular-chatbot-backend:latest

# Build e push do frontend
docker build -f packages/frontend/Dockerfile -t modular-chatbot-frontend .
docker tag modular-chatbot-frontend:latest your-account.dkr.ecr.us-east-1.amazonaws.com/modular-chatbot-frontend:latest
docker push your-account.dkr.ecr.us-east-1.amazonaws.com/modular-chatbot-frontend:latest
```

#### 3. Criar Task Definition

```json
// task-definition.json
{
  "family": "modular-chatbot",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "executionRoleArn": "arn:aws:iam::your-account:role/ecsTaskExecutionRole",
  "containerDefinitions": [
    {
      "name": "backend",
      "image": "your-account.dkr.ecr.us-east-1.amazonaws.com/modular-chatbot-backend:latest",
      "portMappings": [
        {
          "containerPort": 8080,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        },
        {
          "name": "PORT",
          "value": "8080"
        }
      ],
      "secrets": [
        {
          "name": "OPENAI_API_KEY",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:your-account:secret:openai-api-key"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/modular-chatbot",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

#### 4. Criar Service

```bash
aws ecs create-service \
  --cluster your-cluster \
  --service-name modular-chatbot \
  --task-definition modular-chatbot:1 \
  --desired-count 2 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-12345],securityGroups=[sg-12345],assignPublicIp=ENABLED}"
```

---

## 🌊 Google Cloud Run

### Pré-requisitos

- Conta Google Cloud
- gcloud CLI configurado

### Passo a Passo

#### 1. Habilitar APIs

```bash
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com
```

#### 2. Build e Push

```bash
# Backend
gcloud builds submit --tag gcr.io/your-project/modular-chatbot-backend packages/backend/
gcloud run deploy modular-chatbot-backend \
  --image gcr.io/your-project/modular-chatbot-backend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars NODE_ENV=production,PORT=8080 \
  --set-secrets OPENAI_API_KEY=openai-api-key:latest

# Frontend
gcloud builds submit --tag gcr.io/your-project/modular-chatbot-frontend packages/frontend/
gcloud run deploy modular-chatbot-frontend \
  --image gcr.io/your-project/modular-chatbot-frontend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars VITE_API_URL=https://modular-chatbot-backend-xxx-uc.a.run.app
```

---

## 🔧 Configuração de Redis na Nuvem

### Redis Cloud (Gratuito)

1. Acesse [redis.com](https://redis.com)
2. Crie conta gratuita
3. Crie database
4. Copie a URL de conexão

### Upstash Redis

1. Acesse [upstash.com](https://upstash.com)
2. Crie conta
3. Crie database Redis
4. Copie a URL

### AWS ElastiCache

```bash
aws elasticache create-cache-cluster \
  --cache-cluster-id modular-chatbot-redis \
  --engine redis \
  --cache-node-type cache.t3.micro \
  --num-cache-nodes 1
```

---

## 🔐 Configuração de Segurança

### Secrets Management

#### AWS Secrets Manager

```bash
aws secretsmanager create-secret \
  --name openai-api-key \
  --description "OpenAI API Key for Modular Chatbot" \
  --secret-string "sk-your-key-here"
```

#### Google Secret Manager

```bash
echo -n "sk-your-key-here" | gcloud secrets create openai-api-key --data-file=-
```

#### Render/Railway

Use as variáveis de ambiente seguras da plataforma.

### CORS Configuration

```typescript
// packages/backend/src/main.ts
app.enableCors({
  origin: [
    "https://your-frontend-domain.com",
    "https://your-frontend.vercel.app",
    "https://your-frontend.onrender.com",
  ],
  credentials: true,
});
```

---

## 📊 Monitoramento

### Logs

- **Render**: Logs automáticos no dashboard
- **Railway**: Logs em tempo real
- **AWS**: CloudWatch Logs
- **Google Cloud**: Cloud Logging

### Métricas

- **Uptime**: Configure alertas para downtime
- **Performance**: Monitore response time
- **Erros**: Configure alertas para erros 5xx

### Health Checks

```bash
# Verificar se a aplicação está funcionando
curl https://your-backend-url.com/health

# Resposta esperada
{"status":"ok","timestamp":"2024-01-15T10:30:00Z"}
```

---

## 🚨 Troubleshooting

### Problemas Comuns

**Build Fails:**

```bash
# Verificar logs de build
# Render: Dashboard → Logs
# Railway: Deployments → Logs
# AWS: CloudWatch → Log Groups
```

**Runtime Errors:**

```bash
# Verificar logs da aplicação
# Todas as plataformas têm logs em tempo real
```

**CORS Errors:**

```typescript
// Verificar configuração CORS
app.enableCors({
  origin: ["https://your-frontend-domain.com"],
  credentials: true,
});
```

**Redis Connection:**

```bash
# Testar conexão Redis
redis-cli -u your-redis-url ping
# Deve retornar: PONG
```

---

## 💰 Custos Estimados

### Render.com

- **Gratuito**: 750 horas/mês
- **Pago**: $7/mês por serviço

### Railway

- **Gratuito**: $5 créditos/mês
- **Pago**: $20/mês

### AWS ECS

- **Fargate**: ~$15-30/mês (dependendo do uso)
- **ECR**: ~$1/mês

### Google Cloud Run

- **Gratuito**: 2 milhões de requisições/mês
- **Pago**: $0.40/milhão de requisições

---

## 🎯 Recomendação

Para começar rapidamente:

1. **Render.com** - Melhor opção gratuita
2. **Railway** - Mais flexível, mas com limite
3. **Vercel + Railway** - Separação clara frontend/backend

Para produção:

1. **AWS ECS** - Mais controle e escalabilidade
2. **Google Cloud Run** - Serverless, paga por uso

---

## 📚 Recursos Adicionais

- [Render Documentation](https://render.com/docs)
- [Railway Documentation](https://docs.railway.app)
- [AWS ECS Documentation](https://docs.aws.amazon.com/ecs/)
- [Google Cloud Run Documentation](https://cloud.google.com/run/docs)
