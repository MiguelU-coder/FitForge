FROM node:20-alpine

WORKDIR /app

# Enable pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Install required build tools for native packages (argon2, prisma engines)
RUN apk add --no-cache python3 make g++ openssl

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Copy source
COPY . .

# Generate Prisma client using the locally installed version (v5)
RUN pnpm exec prisma generate

# Build the NestJS app
RUN pnpm run build

# Dev dependencies kept for simplicity since husky breaks on prune

# The PORT environment variable is automatically injected by Render
ENV PORT=3000
EXPOSE ${PORT}

# Run migrations + seed then start the app
CMD ["sh", "-c", "pnpm run db:setup && node dist/src/main.js"]
