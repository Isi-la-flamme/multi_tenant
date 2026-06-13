# ============================================
# Stage 1 : Build des dépendances
# ============================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copie des fichiers de dépendances
COPY package*.json ./

# Installation de TOUTES les dépendances (y compris devDependencies)
# nécessaire si vous avez des scripts de build (TypeScript, etc.)
RUN npm ci

# Copie du code source
COPY . .

# Si vous utilisez TypeScript, décommentez la ligne suivante :
# RUN npm run build


# ============================================
# Stage 2 : Image de production légère
# ============================================
FROM node:20-alpine

# Installation des outils nécessaires pour healthcheck
RUN apk add --no-cache curl

WORKDIR /app

# Créer un utilisateur non-root pour la sécurité
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copier les dépendances de production depuis le stage builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./

# Copier le code source
COPY --from=builder /app/src ./src

# Si vous aviez un build TypeScript, copiez plutôt le dossier dist :
# COPY --from=builder /app/dist ./dist

# Définir l'environnement
ENV NODE_ENV=production
ENV PORT=3000

# Exposer le port
EXPOSE 3000

# Changer les permissions pour l'utilisateur non-root
RUN chown -R nodejs:nodejs /app

# Passer à l'utilisateur non-root
USER nodejs

# Healthcheck pour Docker
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1


# Copier le script d'attente
COPY --from=builder /app/src/wait-for-services.js ./src/wait-for-services.js

# Modifier le CMD pour attendre les services
CMD ["sh", "-c", "node src/wait-for-services.js && node src/index.js"]