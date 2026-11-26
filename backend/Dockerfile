# syntax=docker/dockerfile:1.7

FROM node:22-alpine AS base
WORKDIR /app

# 1. Instalación de dependencias del backend (NestJS)
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

# 2. Entorno de desarrollo con Watch Mode (usado por docker-compose.yml)
FROM base AS development
ENV NODE_ENV=development
COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json nest-cli.json tsconfig.json tsconfig.build.json ./
COPY src ./src
EXPOSE 4000
CMD ["npm", "run", "start:dev"]

# 3. Compilación de producción
FROM base AS builder
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json nest-cli.json tsconfig.json tsconfig.build.json ./
COPY src ./src
RUN npm run build

# 4. Imagen final de producción
FROM base AS production
ENV NODE_ENV=production
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/dist ./dist
EXPOSE 4000
CMD ["node", "dist/main.js"]
