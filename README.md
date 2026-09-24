# SIFYGSA-PLATFORM / SFG Business Suite

Plataforma integral de gestión y servicios para **SIFYGSA**.
Suite Empresarial Modular y Escalable desarrollada con arquitectura moderna:
- **Frontend**: React 19 + TypeScript + Vite + Vanilla CSS (Módulos interactivos en versión de desarrollo / standalone)
- **Backend**: API Monolítica Modular con Node.js + Express + TypeScript
- **Infraestructura**: Contenedores Docker multi-etapa con Nginx y Docker Compose

---

## 📌 Flujo de Trabajo y Gestión de Ramas

Para garantizar la estabilidad del software, la trazabilidad del código y despliegues seguros, este repositorio utiliza un flujo basado en entornos escalonados:

$$\mathbf{feature} \longrightarrow \mathbf{dev} \longrightarrow \mathbf{test} \longrightarrow \mathbf{main}$$

---

### 🗺️ Mapa de Ramas y Entornos

| Rama | Entorno | Propósito | Acceso / Modificación |
| :--- | :--- | :--- | :--- |
| **`main`** | **Producción** | Código 100% estable, auditado y listo para usuarios finales. | 🔒 **Solo PR** desde `test` o `hotfix/*`. Push directo bloqueado. |
| **`test`** | **QA / Pruebas** | Entorno de validación funcional, pruebas de integración y control de calidad. | 🔒 **Solo PR** desde `dev`. Push directo bloqueado. |
| **`dev`** | **Desarrollo** | Integración continua de nuevas características del equipo de desarrollo. | 🔒 **Solo PR** desde ramas de trabajo (`feature/*`, `fix/*`). |
| **`feature/*`** | Local / Remoto | Desarrollo de nuevas funcionalidades o módulos individuales. | Creada por cada colaborador desde `dev`. |
| **`fix/*`** | Local / Remoto | Corrección de incidencias detectadas en `dev` o `test`. | Creada por cada colaborador desde `dev`. |
| **`hotfix/*`** | Local / Remoto | Corrección crítica urgente sobre errores en producción (`main`). | Creada desde `main`. |

---

## 🚀 Comandos Rápidos de Desarrollo

### 1. Instalación de Dependencias
```bash
# Instalar dependencias del frontend
npm install

# Instalar dependencias del backend
npm install --prefix server
```

### 2. Ejecución en Modo Desarrollo
```bash
# Iniciar Frontend y Backend simultáneamente
npm run dev

# Iniciar solo Frontend (Vite en http://localhost:5173)
npm run dev:client

# Iniciar solo Backend (Express en http://localhost:5000)
npm run dev:server
```

### 3. Compilación para Producción
```bash
# Compilar todo (Frontend + Backend)
npm run build

# Compilar solo Frontend
npm run build:client

# Compilar solo Backend
npm run build:server
```

---

## 🐳 Despliegue y Ejecución con Docker

El proyecto cuenta con imágenes Docker multi-stage optimizadas para alto rendimiento, bajo peso y máxima seguridad (ejecución sin privilegios root, compresión Gzip, healthchecks y proxy inverso Nginx).

### 1. Iniciar con Docker Compose (Producción)
```bash
# Construir e iniciar contenedores en segundo plano
docker compose up -d --build

# O usando los scripts de package.json:
npm run docker:up
```

- **Frontend (Nginx + SPA)**: `http://localhost:80`
- **Backend API**: `http://localhost:5000/api`
- **Healthcheck**: `http://localhost:5000/api/health`

### 2. Monitorear Logs y Estado
```bash
# Ver logs en tiempo real
npm run docker:logs
# o directamente:
docker compose logs -f

# Ver estado de los contenedores
docker compose ps
```

### 3. Detener Contenedores
```bash
npm run docker:down
# o:
docker compose down
```

### 4. Entorno de Desarrollo con Docker (Hot-Reload)
Si deseas desarrollar dentro de contenedores con recarga en vivo de código:
```bash
docker compose -f docker-compose.dev.yml up --build
```

---

## 📈 Escalabilidad Horizontal

Para escalar las instancias del servidor backend según la demanda de tráfico:

```bash
# Escalar el backend a 3 instancias
docker compose up -d --scale server=3
```

---

## ⚙️ Variables de Entorno

Copie los archivos `.env.example` para personalizar la configuración:

- En la raíz: `.env` (puertos y variables globales)
- En `/server`: `server/.env` (puerto del API, JWT secret, orígenes CORS)
