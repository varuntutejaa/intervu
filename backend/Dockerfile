# Debian-based (not alpine) — faiss-node and onnxruntime-node (a
# @huggingface/transformers dependency) are native addons that ship
# glibc-built prebuilt binaries; alpine's musl libc would force a from-source
# node-gyp rebuild that isn't guaranteed to succeed on every platform/arch.
FROM node:22-bookworm-slim AS base
WORKDIR /app

FROM base AS deps
# Build tooling as a fallback only — used if a native module has no prebuilt
# binary for this exact platform/arch/Node ABI and falls back to node-gyp.
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json ./
RUN npm ci

FROM deps AS build
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

FROM base AS runtime
ENV NODE_ENV=production
COPY package.json package-lock.json ./
# Not --omit=dev: keeps tsx available so `docker exec <container> npm run
# ingest` works for one-off RAG re-indexing without a separate build image.
RUN npm ci \
  && apt-get update && apt-get install -y --no-install-recommends curl \
  && rm -rf /var/lib/apt/lists/*
COPY --from=build /app/dist ./dist
COPY openapi.json ./openapi.json
COPY schema.sql ./schema.sql
COPY scripts ./scripts
COPY knowledge ./knowledge

EXPOSE 3001
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s \
  CMD curl -f http://localhost:3001/api/health || exit 1

CMD ["node", "dist/index.js"]
