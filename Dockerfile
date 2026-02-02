# Stage 1: Build frontend
FROM oven/bun:1 AS frontend-builder

WORKDIR /app/web

# Copy frontend package files
COPY web/package.json web/bun.lock* ./

# Install frontend dependencies
RUN bun install --frozen-lockfile

# Copy frontend source
COPY web/ ./

# Build frontend
RUN bun run build

# Stage 2: Build backend
FROM oven/bun:1 AS backend-builder

WORKDIR /app

# Copy backend package files
COPY package.json bun.lock* ./

# Install backend dependencies
RUN bun install --frozen-lockfile --production

# Copy backend source
COPY src/ ./src/
COPY tsconfig.json ./

# Stage 3: Production image
FROM oven/bun:1-slim AS production

WORKDIR /app

# Copy backend dependencies and source
COPY --from=backend-builder /app/node_modules ./node_modules
COPY --from=backend-builder /app/src ./src
COPY --from=backend-builder /app/package.json ./

# Copy built frontend
COPY --from=frontend-builder /app/web/dist ./web/dist

# Create data directory for SQLite
RUN mkdir -p /app/data

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3001

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3001/health || exit 1

# Run the API server
CMD ["bun", "run", "src/api/index.ts"]
