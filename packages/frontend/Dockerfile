# Multi-stage build para o frontend
FROM node:20-alpine AS builder

# Instalar pnpm globalmente
RUN npm install -g pnpm

# Definir diretório de trabalho
WORKDIR /app

# Copiar arquivos de configuração do workspace
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY tsconfig.base.json ./

# Copiar package.json do frontend
COPY packages/frontend/package.json ./packages/frontend/

# Instalar dependências
RUN pnpm install --frozen-lockfile

# Copiar código fonte
COPY packages/frontend/ ./packages/frontend/

# Build da aplicação
RUN cd packages/frontend && pnpm build

# Stage de produção com nginx
FROM nginx:alpine AS runner

# Instalar wget para health check
RUN apk add --no-cache wget

# Copiar arquivos buildados
COPY --from=builder /app/packages/frontend/dist /usr/share/nginx/html

# Copiar configuração do nginx
COPY packages/frontend/nginx.conf /etc/nginx/nginx.conf

# Criar usuário não-root
RUN addgroup -g 1001 -S nginx-user
RUN adduser -S nginx-user -u 1001 -G nginx-user

# Mudar permissões
RUN chown -R nginx-user:nginx-user /usr/share/nginx/html
RUN chown -R nginx-user:nginx-user /var/cache/nginx
RUN chown -R nginx-user:nginx-user /var/log/nginx
RUN chown -R nginx-user:nginx-user /etc/nginx/conf.d
RUN touch /var/run/nginx.pid
RUN chown -R nginx-user:nginx-user /var/run/nginx.pid

# Expor porta
EXPOSE 5173

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5173/health || exit 1

# Mudar para usuário não-root
USER nginx-user

# Comando para iniciar o nginx
CMD ["nginx", "-g", "daemon off;"]
