# Guía Rápida con Docker — SIFYGSA Business Suite

Esta configuración elimina los errores de *"en mi PC sí funciona"* unificando **Node 22 LTS**, **Next.js (puerto 3000)**, **NestJS (puerto 4000)** y **MongoDB 7 (puerto 27017)** en contenedores reproducibles para Windows, macOS y Linux.

---

## Opción 1 (Recomendada): Levantar TODO con Docker

**Requisitos:** solo tener instalado [Docker Desktop](https://www.docker.com/products/docker-desktop/) (no necesitas instalar Node ni MongoDB en tu PC).

```bash
# Clonar / actualizar el repo y levantar Frontend + Backend NestJS + MongoDB
npm run docker:up
# o directamente:
docker compose up --build
```

Cuando termine de arrancar tendrás disponible:
- **ERP Web (Next.js):** http://localhost:3000
- **API Backend (NestJS):** http://localhost:4000/api/health
- **Documentación Swagger:** http://localhost:4000/api/docs
- **MongoDB local persistente:** `mongodb://localhost:27017/BitacoraSifigsa`

> Los cambios que hagas en `src/` o `backend/src/` se recargan automáticamente (*Hot Reload*).

### Comandos útiles
```bash
# Levantar en segundo plano
npm run docker:up:bg

# Ver logs en tiempo real
npm run docker:logs

# Detener los contenedores (conserva los datos de MongoDB)
npm run docker:down

# Detener y borrar volúmenes de MongoDB/dependencias para iniciar limpio
docker compose down -v
```

### ¿Cómo conectar Docker a MongoDB Atlas en vez del Mongo local?
`docker-compose.yml` carga automáticamente tu archivo `.env.local` (si existe):
- **Si tienes `.env.local` con `MONGODB_URI` real (MongoDB Atlas):** Docker se conecta directo a **MongoDB Atlas** compartido por el equipo.
- **Si NO tienes `.env.local`:** Docker usa automáticamente el contenedor local `sifygsa-mongo` (`mongodb://mongo:27017/BitacoraSifigsa`) sin bloqueos de red ni whitelist de IP.
- *(Opcional)* Si quieres forzar una URI distinta solo para Docker, puedes definir `DOCKER_MONGODB_URI` en `.env.local` o `.env`.

---

## Opción 2 (Equipos con poca RAM): Solo MongoDB en Docker

Si tu laptop tiene 8 GB de RAM y prefieres correr Next.js y NestJS nativamente, pero sin batallar con bloqueos de MongoDB Atlas:

1. Levanta únicamente MongoDB en Docker (~250 MB RAM):
   ```bash
   npm run docker:mongo
   ```
2. En tu `.env.local` pon:
   ```env
   MONGODB_URI="mongodb://localhost:27017/BitacoraSifigsa"
   ```
3. Instala dependencias y arranca en local:
   ```bash
   npm run setup
   npm run dev:all
   ```

---

## Opción 3: Sin Docker (Node.js nativo)

1. Usa **Node.js 22 LTS** (definido en `.nvmrc`).
2. Ejecuta el instalador unificado (instala tanto el frontend raíz como `backend/` y crea `.env.local` si falta):
   ```bash
   npm run setup
   ```
3. Coloca tu `MONGODB_URI` real en `.env.local` y arranca:
   ```bash
   npm run dev:all
   ```

---

## Solución rápida a problemas comunes

- **Puerto 3000, 4000 o 27017 ocupado:** detén cualquier proceso previo (`npm run dev:all` o Mongo local) antes de correr `docker compose up`.
- **Se agregaron nuevos paquetes en `package.json` o `backend/package.json`:** reconstruye las imágenes con `docker compose up --build`.
- **Docker Desktop en Windows pide WSL 2:** abre PowerShell como administrador, ejecuta `wsl --install`, reinicia y vuelve a abrir Docker Desktop.
