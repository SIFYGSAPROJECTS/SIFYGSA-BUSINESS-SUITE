# SIFYGSA Enterprise ERP Suite (Next.js 16 + TypeScript Estricto)

Plataforma ERP modular para **SIFYGSA**, construida sobre **Next.js 16 (App Router)**, **React 19**, **TypeScript estricto (`strict: true`)**, **Zod**, **bcryptjs** y **jose (JWT en cookie `httpOnly`)**.

---

## 📁 Estructura de Carpetas

```text
├── data/                           # Persistencia JSON exclusiva en servidor (nunca expuesta al cliente)
│   ├── usuarios.json               # Cuentas de usuario con passwordHash (bcryptjs) y roles
│   ├── roles-permisos.json         # Matriz RBAC editable desde el Panel de Administración
│   ├── auditoria.json              # Bitácora de actividad y seguridad
│   ├── crm.json                    # Oportunidades, clientes con interacciones y actividades CRM
│   ├── requisiciones.json          # Requisiciones multinivel e historial de trazabilidad
│   └── rrhh.json                   # Expedientes, puestos, asistencias, vacaciones, incidencias y nómina
├── scripts/
│   └── crear-usuario.ts            # CLI interactivo en TypeScript (tsx) para alta de usuarios con bcrypt
├── src/
│   ├── app/                        # App Router de Next.js (páginas delgadas y Route Handlers)
│   │   ├── (auth)/login/           # Pantalla de inicio de sesión
│   │   ├── (dashboard)/            # Layout autenticado con monitoreo de inactividad
│   │   │   ├── admin/              # Panel de Administración General
│   │   │   ├── crm/                # Módulo CRM & Ventas
│   │   │   ├── requisiciones/      # Módulo de Requisiciones y Control Presupuestal
│   │   │   ├── rrhh/               # Módulo de Recursos Humanos y Cumplimiento STPS
│   │   │   └── sin-acceso/         # Vista de bloqueo RBAC por permisos insuficientes
│   │   └── api/                    # Route Handlers delgados que delegan a los servicios
│   ├── components/
│   │   ├── layout/                 # Header, Sidebar dinámico y Footer corporativo
│   │   └── ui/                     # Componentes compartidos (Badge, Button, Icons, Logo, ModalUniversal)
│   ├── config/
│   │   └── types.ts                # Tipos compartidos centralizados (roles, módulos, acciones, estados)
│   ├── context/                    # ThemeContext (Light/Dark) y LanguageContext (ES/EN)
│   ├── lib/
│   │   ├── auth/                   # Sesión JWT (jose), hash (bcryptjs), bloqueo por intentos e inactividad
│   │   ├── permissions/            # Matriz tipada Rol → Módulo → Acciones (cliente/Edge + servidor)
│   │   ├── audit/                  # Servicio de auditoría sobre data/auditoria.json
│   │   └── storage/                # Lectura/escritura atómica con archivo temporal + mutex en memoria
│   ├── modules/
│   │   ├── registry.ts             # Registro central de módulos (genera menú lateral y rutas permitidas)
│   │   ├── admin/                  # Módulo de Administración (components, services, repository, schemas)
│   │   ├── crm/                    # Módulo CRM (Kanban @dnd-kit, clientes, actividades, reportes Excel/PDF)
│   │   ├── requisiciones/          # Módulo Requisiciones (flujo 5 etapas, niveles por monto, alertas)
│   │   └── rrhh/                   # Módulo RRHH (expedientes con redacción de datos sensibles en servidor)
│   └── middleware.ts               # Protección de rutas, verificación JWT e inactividad
├── .env.example                    # Plantilla de variables de entorno documentada
└── package.json
```

---

## ⚙️ Variables de Entorno

Copia `.env.example` a `.env.local` en la raíz del proyecto:

```env
# Secreto criptográfico (mínimo 32 caracteres) para firmar y verificar JWT con jose
AUTH_SECRET="sifygsa_erp_super_secret_jwt_key_2026_production_grade_min32chars"

# Duración total del token JWT en segundos (28800 = 8 horas)
SESSION_DURATION_SECONDS="28800"

# Tiempo máximo de inactividad en minutos antes de expirar la sesión (por defecto 30)
SESSION_INACTIVITY_MINUTES="30"

NODE_ENV="development"
```

---

## 🚀 Cómo Ejecutar el Proyecto

```bash
# 1. Instalar dependencias
npm install

# 2. Iniciar servidor de desarrollo (Next.js en http://localhost:3000)
npm run dev

# 3. Verificar tipos de TypeScript (strict)
npx tsc --noEmit

# 4. Ejecutar linter
npm run lint

# 5. Compilar para producción
npm run build
npm run start
```

---

## 🔐 Cuentas de Prueba (Solo para Desarrollo)

Todas las contraseñas en `data/usuarios.json` están almacenadas con hash `bcryptjs` (factor de costo 10):

| Rol | Usuario | Correo | Contraseña (Desarrollo) | Módulos Permitidos |
| :--- | :--- | :--- | :--- | :--- |
| **Administrador** | `admin` | `admin@sifygsa.com` | `AdminSify2026!` | `admin`, `crm`, `requisiciones`, `rrhh` |
| **Gerente** | `gerente` | `gerente@sifygsa.com` | `GerenteSify2026!` | `crm`, `requisiciones`, `rrhh` (sin datos sensibles) |
| **Vendedor** | `vendedor` | `vendedor@sifygsa.com` | `VentasSify2026!` | `crm`, `requisiciones` |
| **RRHH** | `rrhh` | `rrhh@sifygsa.com` | `RrhhSify2026!` | `rrhh` (con datos sensibles y nómina), `requisiciones` |
| **Requisiciones** | `requisiciones` | `compras@sifygsa.com` | `ComprasSify2026!` | `requisiciones`, `crm` |

---

## 👤 Cómo Crear Usuarios y Gestionar Roles/Permisos

### Opción 1: Desde la terminal (CLI con `tsx`)
```bash
npm run crear-usuario
```
El script solicita nombre, usuario, correo, contraseña, rol y zona, valida con Zod, genera el hash `bcryptjs` y guarda de forma atómica en `data/usuarios.json`.

### Opción 2: Desde el Panel de Administración (`/admin`)
1. Inicia sesión con la cuenta `admin`.
2. En la pestaña **Usuarios**, crea, edita, activa/desactiva cuentas o restablece contraseñas.
3. En la pestaña **Matriz de Roles y Permisos**, marca o desmarca las acciones (`ver`, `crear`, `editar`, `eliminar`, `aprobar`, `exportar`) por rol y módulo; los cambios se guardan en `data/roles-permisos.json`.

---

## 🧩 Cómo Agregar un Módulo Nuevo

1. Agrega el identificador del módulo en `IDS_MODULOS` dentro de `src/config/types.ts`.
2. Define sus permisos iniciales por rol en `MATRIZ_PERMISOS_POR_DEFECTO` (`src/lib/permissions/matrix.ts`).
3. Crea la carpeta `src/modules/<nuevo-modulo>/` con sus capas: `constants/`, `schemas/`, `types/`, `repository/`, `services/`, `components/` y `README.md`.
4. Registra el módulo en `REGISTRO_MODULOS` dentro de `src/modules/registry.ts`. El menú lateral (`Sidebar.tsx`) y el protector de rutas (`src/middleware.ts`) lo incorporarán automáticamente.
5. Crea la página delgada en `src/app/(dashboard)/<nuevo-modulo>/page.tsx` y sus Route Handlers en `src/app/api/<nuevo-modulo>/route.ts`.
