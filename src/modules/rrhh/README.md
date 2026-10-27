# Módulo de Recursos Humanos (`src/modules/rrhh`)

## ¿Qué hace?
Gestiona el talento humano e indicadores de cumplimiento STPS / SIL-3:
- **Expediente de Empleados**: Registro de personal con protección estricta de datos sensibles en el servidor (`salarioMensual`, `rfc`, `nss`, `cuentaClabe`, `contactoEmergencia`).
- **Puestos y Áreas**: Control de plazas autorizadas vs. ocupadas y requisito de certificación SIL-3.
- **Control de Asistencia**: Registro de entradas, salidas, horas trabajadas y estatus por sede.
- **Vacaciones y Permisos**: Flujo de solicitud y aprobación/rechazo con auditoría.
- **Incidencias STPS / DC-3**: Seguimiento de vencimientos de certificados DC-3, retardos y reconocimientos.
- **Nómina Confidencial**: Vista restringida desde el servidor exclusivamente a `administrador` y `rrhh`.

## ¿Cómo se modifica?
- **Roles con acceso a datos sensibles**: `ROLES_AUTORIZADOS_DATOS_SENSIBLES` en `constants/index.ts`.
- **Esquemas Zod**: `schemas/rrhh.schema.ts`.
- **Repositorio**: `repository/rrhh.repository.ts` (`IRepositorioRrhh`).
- **Redacción de datos sensibles y reglas de negocio**: `services/rrhh.service.ts`.

## ¿Cómo se extiende?
Agrega nuevas entidades en `schemas/rrhh.schema.ts` y expón los casos de uso en `services/rrhh.service.ts`, asegurándote de filtrar cualquier campo sensible en `redactarEmpleadoSegunRol`.
