# ==========================================
# Etapa 1: Compilación (Build Stage)
# ==========================================
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install

COPY tsconfig.json ./
COPY src ./src

RUN npm run build

# ==========================================
# Etapa 2: Entorno de Ejecución (Runtime)
# ==========================================
FROM node:20-alpine AS runner

ENV NODE_ENV=production \
    PORT=5000

WORKDIR /app

RUN addgroup -S nodeapp && adduser -S nodeapp -G nodeapp

COPY package.json package-lock.json* ./
RUN npm install --omit=dev && npm cache clean --force

COPY --from=builder /app/dist ./dist

RUN chown -R nodeapp:nodeapp /app
USER nodeapp

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:5000/api/health || exit 1

CMD ["node", "dist/index.js"]
