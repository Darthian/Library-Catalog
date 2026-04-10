# ── Stage 1: install all dependencies (including dev) ──────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

# ── Stage 2: run tests ─────────────────────────────────────────────────────────
# This stage fails the build if any test suite fails.
FROM deps AS test
COPY . .
RUN npm test
RUN npm run test:e2e

# ── Stage 3: production build ──────────────────────────────────────────────────
FROM deps AS build
COPY . .
RUN npm run build

# ── Stage 4: production image ──────────────────────────────────────────────────
FROM node:20-alpine AS prod
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=build /app/dist ./dist
EXPOSE 3002
CMD ["node", "dist/main"]
