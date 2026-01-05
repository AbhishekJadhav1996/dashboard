# Multi-stage build for Kubernetes Dashboard Pro

# Stage 1: Build frontend
FROM node:18-alpine AS frontend-builder
WORKDIR /app/client
COPY client/package*.json ./
RUN npm install
COPY client/ .
RUN npm run build

# Stage 2: Build backend and serve
FROM node:18-alpine
WORKDIR /app

# Install kubectl (optional, for debugging)
RUN apk add --no-cache curl

# Copy backend files
COPY server/package*.json ./
RUN npm install --production

COPY server/ .

# Copy built frontend
COPY --from=frontend-builder /app/client/build ./public

# Expose port
EXPOSE 3001

# Start server
CMD ["node", "index.js"]

