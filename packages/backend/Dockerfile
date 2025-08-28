# Multi-stage build para o backend
FROM node:20-alpine AS builder

# Instalar pnpm globalmente
RUN npm install -g pnpm

# Definir diretório de trabalho
WORKDIR /app

# Copiar arquivos de configuração do workspace
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Copiar package.json do backend
COPY packages/backend/package.json ./packages/backend/

# Instalar dependências
RUN pnpm install --frozen-lockfile

# Copiar código fonte
COPY packages/backend/ ./packages/backend/

# Build da aplicação
RUN cd packages/backend && pnpm build

# Stage de produção
FROM node:20-alpine AS runner

# Instalar pnpm globalmente
RUN npm install -g pnpm

# Criar usuário não-root
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nestjs -u 1001

# Definir diretório de trabalho
WORKDIR /app

# Copiar arquivos de configuração do workspace
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Copiar package.json do backend
COPY packages/backend/package.json ./packages/backend/

# Instalar apenas dependências de produção
RUN pnpm install --frozen-lockfile --prod

# Copiar código compilado
COPY --from=builder --chown=nestjs:nodejs /app/packages/backend/dist ./packages/backend/dist
COPY --from=builder --chown=nestjs:nodejs /app/node_modules ./node_modules

# Mudar para usuário não-root
USER nestjs

# Expor porta
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8080/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Comando para iniciar a aplicação
WORKDIR /app/packages/backend
CMD ["node", "dist/main.js"]
    