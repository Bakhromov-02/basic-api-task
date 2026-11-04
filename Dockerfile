# Build stage
FROM node:20-alpine3.20 AS builder

WORKDIR /app

COPY package*.json tsconfig*.json nest-cli.json ./
RUN npm ci

COPY src/ ./src/
RUN npm run build && npm prune --omit=dev && npm cache clean --force

# Runtime stage
FROM node:20-alpine3.20 AS production

ENV NODE_ENV=production
WORKDIR /app

# Configuration comes from the environment at runtime (docker compose env_file), never from the image.
COPY --from=builder --chown=node:node /app/dist ./dist
COPY --from=builder --chown=node:node /app/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/package.json ./

USER node
EXPOSE 7000

CMD ["node", "dist/main.js"]
