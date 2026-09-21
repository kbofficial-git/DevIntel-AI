# ==========================================
# Stage 1: Build & Prune
# ==========================================
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies including devDependencies for build
COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci

COPY tsconfig.json ./
COPY src ./src

# Generate Prisma Client and compile TypeScript
RUN npx prisma generate
RUN npm run build

# ==========================================
# Stage 2: Production Runner
# ==========================================
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Install only production dependencies
COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci --only=production && npx prisma generate

# Copy compiled artifacts from builder stage
COPY --from=builder /app/dist ./dist

# Run as non-root user
USER node

EXPOSE 4000

CMD ["node", "dist/server.js"]
