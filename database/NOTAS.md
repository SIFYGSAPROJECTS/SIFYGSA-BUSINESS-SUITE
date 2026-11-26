# Notas de Análisis — Esquema PostgreSQL `sifygsa`

- **Fuente analizada:** `sifygsa_schema.sql` (PostgreSQL 15+, 1,919 líneas).
- **Conteo validado contra SQL:**
  - **Esquemas:** 7 (`catalogos, seguridad, rrhh, crm, compras, facturacion, inventario`)
  - **Tablas:** 58 (`CREATE TABLE` reales en el SQL: 58; el enunciado mencionaba ~51, pero el archivo real contiene **58 tablas** distribuidas en los 7 esquemas)
  - **Referencias (`REFERENCES`):** 103 (coincidencia exacta 103/103 con el SQL)
  - **Dominios propios detectados:** 7 (`sifygsa_rfc`, `sifygsa_email`, `sifygsa_telefono`, `sifygsa_monto`, `sifygsa_tipo_cambio`, `sifygsa_cantidad`, `sifygsa_porcentaje`)

## Tablas sin relaciones (aisladas)
- `catalogos.bancos`

## Autorreferencias y FKs circulares
- **Autorreferencias (misma tabla):** 0

- **Ciclos mutuos entre pares de tablas:** 0


## Convenciones aplicadas en los diagramas
1. **Notación en `sifygsa_er.drawio`:**
   - Columnas `NOT NULL` (no PK) marcadas con sufijo `*`.
   - Columnas `UNIQUE` (no PK) marcadas con sufijo `(U)`.
   - Columnas que son simultáneamente `PK` y `FK` muestran `PK,FK` en la primera celda de 30 px.
   - Las FKs entre distintos esquemas apuntan a tablas "fantasma" (`esquema.tabla`) con borde punteado y únicamente su(s) fila(s) `PK`.
2. **Notación en `sifygsa_clases_uml.drawio`:**
   - Tablas puente (`seguridad.roles_permisos`, `seguridad.usuario_modulos`) representadas como asociación `0..* : 0..*` entre sus dos entidades principales más enlace punteado hacia la clase puente.
   - Tablas con triggers asociados muestran las funciones de trigger en el compartimento de operaciones (`+ fn_...()`).
