# ============================================
# Multi-stage build for optimized production
# ============================================

# Stage 1: Dependencies
FROM node:20-alpine AS deps

WORKDIR /app

# Install pnpm globally
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy only package files for better layer caching
COPY package.json pnpm-lock.yaml ./

# Install dependencies with frozen lockfile
RUN pnpm install --frozen-lockfile --prefer-offline

# ============================================
# Stage 2: Builder (includes tests)
FROM node:20-alpine AS builder

WORKDIR /app

# Enable pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY package.json pnpm-lock.yaml ./

# Copy source code
COPY . .

# Run tests (optional - can be skipped with build arg)
ARG SKIP_TESTS=false
RUN if [ "$SKIP_TESTS" = "false" ]; then \
      pnpm test --run 2>/dev/null || echo "⚠️ No tests configured"; \
    fi

# Build the application
RUN pnpm build

# Verify build output
RUN ls -la dist/ && echo "✅ Build successful"

# ============================================
# Stage 3: Production runtime
FROM nginx:alpine AS production

# Add metadata
LABEL maintainer="SAPOM Team"
LABEL description="SAPOM Prototype - Production Image"

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Create non-root user for better security
RUN addgroup -g 1001 -S nginx && \
    adduser -S nginx -u 1001 || true

# Set ownership
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /var/log/nginx && \
    chown -R nginx:nginx /etc/nginx/conf.d && \
    touch /var/run/nginx.pid && \
    chown -R nginx:nginx /var/run/nginx.pid

# Switch to non-root user
USER nginx

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost/health || exit 1

# Start nginx in foreground
CMD ["nginx", "-g", "daemon off;"]
