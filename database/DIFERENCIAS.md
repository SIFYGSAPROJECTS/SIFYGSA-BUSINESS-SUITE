# Diferencias entre `almacen.drawio` y `sifygsa_schema.sql` (esquema `inventario` + `catalogos.unidades_medida`)

## 1. Tablas y columnas que FALTAN en `almacen.drawio`
### Tablas completas faltantes en `almacen.drawio`:
- `inventario.articulos_series`
- `inventario.devoluciones_retorno_obra`
- `inventario.devolucion_partidas`
- Tablas fantasma inter-esquema referenciadas por `inventario`: `catalogos.proyectos_contratos`, `catalogos.sat_productos_servicios`, `compras.orden_partidas`, `compras.ordenes_compra`, `compras.proveedores`, `rrhh.sucursales_sedes`

### Columnas faltantes en tablas existentes (agregadas en `almacen_actualizado.drawio`):
- **`unidades_medida` → `catalogos.unidades_medida`:** `codigo`, `clave_sat`, `descripcion_sat`, `categoria`, `activo`
- **`articulos` → `inventario.articulos`:** `id`, `sku`, `descripcion_corta`, `descripcion_detallada`, `tipo_articulo`, `categoria`, `custodia`, `marca`, `modelo`, `unidad_medida`, `clave_sat`, `unidad_sat`, `precio_referencia_mxn`, `requiere_serie_unica`, `es_inventariable`, `almacen_predeterminado_id`, `ubicacion_predeterminada`, `stock_maximo`, `calibracion_requerida`, `frecuencia_calibracion_meses`, `norma_certificacion`, `imagen_url`, `estatus`, `creado_en`, `actualizado_en`
- **`inventario` → `inventario.existencias`:** `id`, `articulo_id`, `almacen_id`, `ubicacion_nombre`, `stock_total`, `stock_disponible`, `stock_proyecto`, `stock_mantenimiento`, `actualizado_en`
- **`almacenes` → `inventario.almacenes`:** `id`, `tipo_almacen`, `sucursal_sede_id`, `responsable_nombre`, `creado_en`
- **`ubicaciones_almacen` → `inventario.almacen_ubicaciones`:** `id`, `almacen_id`, `nave_zona`, `rack_pasillo`, `nivel_posicion`, `codigo_completo`, `activo`
- **`entradas_inventario` → `inventario.recepciones_ir03`:** `id`, `orden_compra_id`, `orden_compra_folio`, `contrato_proyecto`, `proveedor_id`, `proveedor_nombre`, `remision_factura`, `fecha_recepcion`, `almacenista_nombre`, `almacen_destino_id`, `ubicacion_general`, `notas`, `motivo_eliminacion`, `fecha_eliminacion`, `usuario_eliminacion`, `creado_en`, `actualizado_en`, `activo`
- **`detalle_entrada` → `inventario.recepcion_ir03_partidas`:** `id`, `recepcion_id`, `orden_partida_id`, `sku`, `descripcion`, `cantidad_solicitada_po`, `cantidad_facturada`, `cantidad_recibida_fisica`, `stock_disponible_previo`, `unidad_medida`, `ubicacion_destino`, `estado_partida`, `series_recibidas`, `observaciones`
- **`salidas_inventario` → `inventario.vales_salida_sa`:** `id`, `proyecto_codigo`, `solicitud_material_folio`, `fecha_salida`, `responsable_recibe_nombre`, `cargo_area`, `numero_empleado`, `almacenista_despacho`, `almacen_origen_id`, `firmado_fisico`, `firma_digital_svg`, `creado_en`, `actualizado_en`, `activo`
- **`detalle_salida` → `inventario.vale_salida_sa_partidas`:** `id`, `vale_salida_id`, `sku`, `descripcion`, `unidad_medida`, `custodia`, `ubicacion_origen`, `series_despachadas`, `notas`
- **`movimientos_inventario` → `inventario.kardex_movimientos`:** `id`, `folio_movimiento`, `fecha_hora`, `articulo_id`, `articulo_sku`, `articulo_nombre`, `almacen_id`, `ubicacion_nombre`, `cantidad_entrada`, `cantidad_salida`, `saldo_existencia`, `costo_unitario`, `documento_referencia`, `responsable_nombre`, `frente_proyecto_codigo`, `observaciones`
- **`mantenimientos` → `inventario.mantenimientos_calibraciones`:** `id`, `folio`, `articulo_id`, `articulo_sku`, `articulo_nombre`, `numero_serie`, `cantidad`, `almacen_origen_id`, `tipo_mantenimiento`, `estado_mantenimiento`, `fecha_envio`, `fecha_estimada_retorno`, `fecha_retorno_real`, `responsable_o_proveedor`, `costo_mantenimiento`, `diagnostico_falla`, `observaciones_resolucion`, `usuario_registro`, `creado_en`, `actualizado_en`, `activo`

## 2. Tablas y columnas que SOBRAN en `almacen.drawio`
### Tablas inexistentes en `sifygsa_schema.sql` (pendientes de decisión — conservadas con borde rojo punteado en `almacen_actualizado.drawio`):
- `categorias_articulo` (`alm-1`) — pendiente de decisión
- `servicios` (`alm-219`) — pendiente de decisión
- `movimientos_servicio` (`alm-235`) — pendiente de decisión
- `tipos_mantenimiento` (`alm-263`) — pendiente de decisión

### Columnas presentes en `almacen.drawio` que no existen en la tabla SQL equivalente:
- **`unidades_medida` (`catalogos.unidades_medida`):** `id_unidad`, `clave`
- **`articulos` (`inventario.articulos`):** `id_articulo`, `id_categoria`, `id_unidad`, `codigo`, `descripcion`, `requiere_mantenimiento`, `fecha_creacion`
- **`inventario` (`inventario.existencias`):** `id_inventario`, `id_articulo`, `id_almacen`, `id_ubicacion`, `existencia`
- **`almacenes` (`inventario.almacenes`):** `id_almacen`, `direccion`
- **`ubicaciones_almacen` (`inventario.almacen_ubicaciones`):** `id_ubicacion`, `id_almacen`, `codigo`, `descripcion`
- **`entradas_inventario` (`inventario.recepciones_ir03`):** `id_entrada`, `id_almacen`, `fecha`, `id_proveedor`, `id_orden_compra`, `id_usuario`, `observaciones`
- **`detalle_entrada` (`inventario.recepcion_ir03_partidas`):** `id_detalle_entrada`, `id_entrada`, `id_articulo`, `id_ubicacion`, `cantidad`, `costo_unitario`
- **`salidas_inventario` (`inventario.vales_salida_sa`):** `id_salida`, `id_almacen`, `fecha`, `id_proyecto`, `id_solicitante`, `id_usuario`
- **`detalle_salida` (`inventario.vale_salida_sa_partidas`):** `id_detalle_salida`, `id_salida`, `id_articulo`, `id_ubicacion`
- **`movimientos_inventario` (`inventario.kardex_movimientos`):** `id_movimiento`, `id_articulo`, `id_almacen`, `cantidad`, `saldo_resultante`, `referencia_tipo`, `referencia_id`, `fecha`
- **`mantenimientos` (`inventario.mantenimientos_calibraciones`):** `id_mantenimiento`, `id_articulo`, `id_tipo_mantenimiento`, `id_ubicacion`, `id_responsable`, `fecha_entrada`, `fecha_inicio`, `fecha_fin`, `proceso`, `estatus`, `observaciones`

## 3. Tablas y columnas cuyo NOMBRE, TIPO o MARCA FK/PK NO COINCIDE
### Tablas con nombre distinto entre `almacen.drawio` y `sifygsa_schema.sql`:
- `inventario` → `inventario.existencias`
- `ubicaciones_almacen` → `inventario.almacen_ubicaciones`
- `entradas_inventario` → `inventario.recepciones_ir03`
- `detalle_entrada` → `inventario.recepcion_ir03_partidas`
- `salidas_inventario` → `inventario.vales_salida_sa`
- `detalle_salida` → `inventario.vale_salida_sa_partidas`
- `movimientos_inventario` → `inventario.kardex_movimientos`
- `mantenimientos` → `inventario.mantenimientos_calibraciones`

### Diferencias de tipos, PKs y FKs:
- En `almacen.drawio`, **ninguna columna tenía tipo de dato**; en `almacen_actualizado.drawio` se agregaron los tipos exactos del SQL (`VARCHAR`, `TEXT`, `BOOLEAN`, `DATE`, `TIMESTAMPTZ`, `BIGSERIAL`, `sifygsa_monto`, `sifygsa_cantidad`, `TEXT[]`).
- En `almacen.drawio`, las PKs usaban nombres como `id_articulo`, `id_almacen`, `id_unidad`; en el SQL la PK de todas las tablas de `inventario` es `id` (y en `catalogos.unidades_medida` es `codigo`).
- En `almacen.drawio`, columnas que son FK en el SQL aparecían sin marca `FK` (por ejemplo: `id_proveedor` → `proveedor_id`, `id_orden_compra` → `orden_compra_id`, `id_proyecto` → `proyecto_codigo`, `almacen_predeterminado_id`, `sucursal_sede_id`, `clave_sat`). Todas quedaron marcadas con `FK` en `almacen_actualizado.drawio`.
