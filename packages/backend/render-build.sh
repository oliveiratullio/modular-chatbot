#!/usr/bin/env bash
set -euxo pipefail

# alinhe com package.json raiz (atual: pnpm@9.0.0)
corepack enable
corepack prepare pnpm@9.0.0 --activate

pnpm install --frozen-lockfile --prod=false
pnpm build

# garanta que o artefato existe (falha o build se não existir)
test -s packages/backend/dist/main.js

echo "BUILD OK"
ls -la dist
