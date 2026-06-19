FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-alpine
LABEL org.opencontainers.image.source="https://github.com/dev-montyoh/vikunja-mcp"
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev && npm install -g supergateway
COPY --from=builder /app/dist ./dist
CMD ["sh", "-c", "supergateway --stdio 'node /app/dist/index.js' --port ${PORT:-80} --baseUrl ${BASE_URL:-http://localhost}"]
