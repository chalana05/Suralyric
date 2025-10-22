## Multi-stage build to avoid copying host node_modules and ensure clean perms

# 1) Install all deps (including dev) for building
FROM node:18-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

# 2) Build the React app
FROM node:18-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# 3) Production runtime with only prod deps
FROM node:18-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy server and built static assets
COPY --from=builder /app/build ./build
COPY server.js ./server.js

# Optional: keep uploads dir writable at runtime
RUN mkdir -p /app/uploads

# Expose API/server port (server listens on 3001 by default)
EXPOSE 3001

CMD ["npm", "run", "production"]
