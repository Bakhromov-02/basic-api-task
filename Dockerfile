# Development layer
FROM node:slim AS builder

WORKDIR /app

# Copy only files needed for install
COPY package*.json ./
COPY tsconfig*.json ./
COPY nest-cli.json ./

# Copy the .env file
COPY .env ./

# Install dependencies
RUN npm ci

# Copy source code
COPY src/ ./src/

# Build application
RUN npm run build

# Remove development dependencies and clear npm cache
RUN npm prune --production && \
    npm cache clean --force

# Production layer
FROM node:slim AS production

ENV NODE_ENV=production

WORKDIR /app

# Copy only necessary files from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

# Expose application port
EXPOSE 7000

# Start application
CMD [ "node", "dist/main.js" ]