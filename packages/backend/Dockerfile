# ---------- base de deps (workspace) ----------
    FROM node:20-alpine AS deps
    WORKDIR /app
    # habilita pnpm
    RUN corepack enable && corepack prepare pnpm@9.9.0 --activate
    
    # copia manifestos suficientes para instalar deps do monorepo
    COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
    COPY packages/backend/package.json packages/backend/
    
    # instala com dev deps (precisamos de typescript p/ build)
    RUN pnpm install -w --frozen-lockfile --prod=false
    
    # ---------- build ----------
    FROM node:20-alpine AS builder
    WORKDIR /app
    RUN corepack enable && corepack prepare pnpm@9.9.0 --activate
    COPY . .
    
    # ---------- runtime ----------
    FROM node:20-alpine AS runner
    WORKDIR /app/packages/backend
    ENV NODE_ENV=production
    # copiamos apenas node_modules (raiz) e o dist do backend
    COPY --from=deps /app/node_modules /app/node_modules
    COPY --from=builder /app/packages/backend/dist ./dist
    # porta é injetada pelo Render via $PORT
    CMD ["node", "dist/main.js"]
    