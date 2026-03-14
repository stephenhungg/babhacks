FROM node:20-slim AS base

WORKDIR /app

# copy root package files for workspace resolution
COPY package.json package-lock.json tsconfig.base.json ./

# copy all workspace package.json files
COPY packages/shared/package.json packages/shared/
COPY packages/xrpl-contracts/package.json packages/xrpl-contracts/
COPY packages/ai-agent/package.json packages/ai-agent/

# install all dependencies (needs workspace resolution)
RUN npm ci

# copy source code
COPY packages/shared/ packages/shared/
COPY packages/xrpl-contracts/ packages/xrpl-contracts/
COPY packages/ai-agent/ packages/ai-agent/

# build in dependency order: shared -> xrpl-contracts -> ai-agent
RUN npm run build --workspace=packages/shared && \
    npm run build --workspace=packages/xrpl-contracts && \
    npm run build --workspace=packages/ai-agent

# --- production stage ---
FROM node:20-slim AS production

WORKDIR /app

# run as non-root user
RUN addgroup --system appgroup && adduser --system --ingroup appgroup appuser

COPY package.json package-lock.json ./
COPY packages/shared/package.json packages/shared/
COPY packages/xrpl-contracts/package.json packages/xrpl-contracts/
COPY packages/ai-agent/package.json packages/ai-agent/

RUN npm ci --omit=dev

# copy built output
COPY --from=base /app/packages/shared/dist packages/shared/dist
COPY --from=base /app/packages/xrpl-contracts/dist packages/xrpl-contracts/dist
COPY --from=base /app/packages/ai-agent/dist packages/ai-agent/dist

USER appuser

ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 3001

CMD ["node", "packages/ai-agent/dist/src/server.js"]
