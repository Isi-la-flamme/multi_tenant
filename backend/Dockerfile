# ============================================
# Stage 1 : Build des dépendances
# ============================================
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci
COPY . .


# ============================================
# Stage 2 : Image de production légère
# ============================================
FROM node:20-alpine

RUN apk add --no-cache curl

WORKDIR /app

RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/src ./src
COPY --from=builder /app/src/wait-for-services.js ./src/wait-for-services.js

# Créer le dossier uploads AVANT le chown
RUN mkdir -p /app/uploads

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

# Changer les permissions (inclut maintenant /app/uploads)
RUN chown -R nodejs:nodejs /app

USER nodejs

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

CMD ["sh", "-c", "node src/wait-for-services.js && node src/index.js"]