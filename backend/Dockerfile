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

# Prune dev dependencies (optional, but good for saving memory in Railway)
RUN pnpm prune --prod

# The PORT environment variable is automatically injected by Railway
ENV PORT=3000
EXPOSE ${PORT}

# Production start command
CMD ["node", "dist/main.js"]
