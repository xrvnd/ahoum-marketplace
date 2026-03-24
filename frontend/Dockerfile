# Stage 1: Builder
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# Stage 2: Runner
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# standalone output bundles everything needed into .next/standalone/
COPY --from=builder /app/public                    ./public
COPY --from=builder /app/.next/standalone          ./
COPY --from=builder /app/.next/static              ./.next/static

EXPOSE 3000

# standalone output generates a self-contained server.js at the root
CMD ["node", "server.js"]