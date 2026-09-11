# ==============================================================================
# Multi-Stage Production Dockerfile: PICC-PP-Admin-Portal-Frontend
# ==============================================================================

# ------------------------------------------------------------------------------
# Stage 1: Build Application Assets
# ------------------------------------------------------------------------------
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency manifests
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci --legacy-peer-deps

# Copy application source files
COPY . .

# Build production bundle
RUN npm run build

# ------------------------------------------------------------------------------
# Stage 2: Hardened Unprivileged NGINX Runtime
# ------------------------------------------------------------------------------
FROM nginxinc/nginx-unprivileged:1.27-alpine AS runtime

# Copy compiled assets to NGINX document root
COPY --from=builder /app/dist/ /srv/www/htdocs/nnp-admin/
COPY --from=builder /app/dist/ /srv/www/htdocs/

# Copy custom security-hardened NGINX server block
COPY default.conf /etc/nginx/conf.d/default.conf

# Standard unprivileged application user (UID 101)
USER 101

# Expose HTTP port
EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:8080/healthz || exit 1

CMD ["nginx", "-g", "daemon off;"]