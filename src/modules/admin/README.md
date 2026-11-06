# Módulo de Administración (`src/modules/admin`)

## ¿Qué hace?
Centraliza el gobierno y la seguridad del ERP SIFYGSA:
- **Indicadores Globales**: Métricas consolidadas de CRM, Requisiciones, Recursos Humanos, Usuarios y Auditoría, con accesos directos a todos los módulos.
- **Gestión de Usuarios**: Alta de cuentas con `bcryptjs`, edición de rol/zona/módulos, activación/desactivación y restablecimiento seguro de contraseña.
- **Matriz de Roles y Permisos**: Editor interactivo (`Rol → Módulo → Acciones`) persistido en `data/roles-permisos.json`.
- **Bitácora de Auditoría**: Consulta paginada y filtrable de `data/auditoria.json` (inicios de sesión, intentos fallidos, creaciones, ediciones, aprobaciones y cambios de permisos).

## ¿Cómo se modifica?
- **Validaciones**: Edita `schemas/admin.schema.ts`.
- **Persistencia**: `repository/usuarios.repository.ts` implementa `IRepositorioUsuarios`. Para migrar a PostgreSQL o SQL Server, reemplaza `RepositorioUsuariosJson` sin tocar servicios ni componentes.
- **Lógica de negocio**: Edita `services/admin.service.ts`.

## ¿Cómo se extiende?
Agrega nuevas sub-vistas en `components/`, regístralas en `src/modules/registry.ts` bajo el módulo `admin` y expón los endpoints correspondientes en `src/app/api/admin/`.
