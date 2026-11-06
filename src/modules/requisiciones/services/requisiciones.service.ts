import { registrarAccionUsuario } from '@/lib/audit';
import { ErrorAutorizacion, type PayloadSesion } from '@/lib/auth';
import { tienePermiso } from '@/lib/permissions';
import { obtenerMatrizPermisos } from '@/lib/permissions/server';
import {
  determinarNivelAprobacion,
  ETIQUETAS_ESTADO_REQUISICION,
  LIMITE_REQUISICIONES_POR_HORA,
  NIVELES_APROBACION_MONTO,
  type EstadoRequisicion,
} from '../constants';
import { repositorioRequisiciones } from '../repository/requisiciones.repository';
import {
  esquemaActualizarRequisicion,
  esquemaCrearRequisicion,
  esquemaTransicionRequisicion,
} from '../schemas/requisicion.schema';
import type {
  EntradaActualizarRequisicion,
  EntradaCrearRequisicion,
  EntradaTransicionRequisicion,
  NotaSistemaRequisicion,
  Requisicion,
} from '../types';
import { obtenerAlertasPendientesPorRol } from '../utils/alertas-requisiciones';

export { obtenerAlertasPendientesPorRol };

const TRANSICIONES_VALIDAS: Record<EstadoRequisicion, EstadoRequisicion[]> = {
  solicitud: ['revision', 'rechazada', 'cancelada'],
  revision: ['aprobacion', 'rechazada', 'cancelada'],
  aprobacion: ['atencion', 'rechazada'],
  atencion: ['cierre'],
  cierre: [],
  rechazada: ['solicitud'],
  cancelada: [],
};

export function esPropietarioRequisicion(req: Requisicion, actor: PayloadSesion): boolean {
  if (req.solicitanteId && req.solicitanteId === actor.sub) {
    return true;
  }
  return req.solicitante.trim().toLowerCase() === actor.nombre.trim().toLowerCase();
}

export async function listarRequisiciones(): Promise<Requisicion[]> {
  return repositorioRequisiciones.listarTodas();
}

export async function listarRequisicionesParaUsuario(
  actor: PayloadSesion
): Promise<Requisicion[]> {
  const matriz = await obtenerMatrizPermisos();
  const puedeVerTodas = tienePermiso(
    actor.rol,
    'requisiciones',
    'ver',
    actor.modulosPermitidos,
    matriz
  );
  const puedeVerPropias = tienePermiso(
    actor.rol,
    'requisiciones',
    'ver_propias',
    actor.modulosPermitidos,
    matriz
  );

  if (!puedeVerTodas && !puedeVerPropias) {
    throw new ErrorAutorizacion('No tienes permiso para consultar requisiciones.');
  }

  const todas = await repositorioRequisiciones.listarTodas();
  if (puedeVerTodas) {
    return todas;
  }

  return todas.filter((r) => esPropietarioRequisicion(r, actor));
}

export async function crearNuevaRequisicion(
  entrada: EntradaCrearRequisicion,
  actor: PayloadSesion
): Promise<Requisicion> {
  const validado = esquemaCrearRequisicion.parse(entrada);
  const actuales = await repositorioRequisiciones.listarTodas();

  // 1. El solicitante SIEMPRE se toma de la sesión en el servidor
  const nombreSolicitante = actor.nombre;
  const idSolicitante = actor.sub;

  // 2. Protección contra abuso: límite de requisiciones creadas por usuario en la última hora
  const haceUnaHoraMs = Date.now() - 60 * 60 * 1000;
  const creadasUltimaHora = actuales.filter((r) => {
    const fechaMs = new Date(r.fechaCreacion).getTime();
    return (
      !Number.isNaN(fechaMs) &&
      fechaMs >= haceUnaHoraMs &&
      esPropietarioRequisicion(r, actor)
    );
  });

  if (creadasUltimaHora.length >= LIMITE_REQUISICIONES_POR_HORA) {
    throw new Error(
      `Límite alcanzado: máximo ${LIMITE_REQUISICIONES_POR_HORA} requisiciones por hora por usuario.`
    );
  }

  // 3. Prevención de requisiciones duplicadas activas
  const duplicada = actuales.find(
    (r) =>
      r.estado !== 'rechazada' &&
      r.estado !== 'cancelada' &&
      r.estado !== 'cierre' &&
      r.contrato.toLowerCase() === validado.contrato.toLowerCase() &&
      r.justificacion.toLowerCase() === validado.justificacion.toLowerCase()
  );

  if (duplicada) {
    throw new Error(
      `Ya existe una requisición activa (${duplicada.folio}) con el mismo contrato y nota/justificación.`
    );
  }

  const partidas = validado.partidas.map((p, idx) => ({
    ...p,
    id: `part_${Date.now()}_${idx}`,
    subtotal: Number((p.cantidad * p.precioUnitario).toFixed(2)),
  }));

  const subtotal = Number(partidas.reduce((s, p) => s + p.subtotal, 0).toFixed(2));
  const iva = Number((subtotal * 0.16).toFixed(2));
  const total = Number((subtotal + iva).toFixed(2));
  const nivel = determinarNivelAprobacion(total);
  const ahora = new Date().toISOString();
  const numSecuencia = actuales.length + 81;
  const folioGenerado = `SFG-${validado.contrato.slice(0, 9).toUpperCase()}-RQ-${numSecuencia}/26`;

  const notasInicialesNetSuite: NotaSistemaRequisicion[] = [
    {
      id: `ns_${Date.now()}_1`,
      fecha: ahora,
      usuarioNombre: nombreSolicitante,
      rolUsuario: actor.rol,
      contexto: 'UI — SIFYGSA Requisición (Oracle NetSuite)',
      tipoOperacion: 'Creación',
      campo: 'Requisición Nº (Transacción)',
      valorAnterior: '—',
      valorNuevo: folioGenerado,
    },
    {
      id: `ns_${Date.now()}_2`,
      fecha: ahora,
      usuarioNombre: nombreSolicitante,
      rolUsuario: actor.rol,
      contexto: 'UI — SIFYGSA Requisición (Oracle NetSuite)',
      tipoOperacion: 'Creación',
      campo: 'Importe Total (IVA 16% inc.)',
      valorAnterior: '$0.00 MXN',
      valorNuevo: `$${total.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN (${partidas.length} partida(s))`,
    },
    {
      id: `ns_${Date.now()}_3`,
      fecha: ahora,
      usuarioNombre: nombreSolicitante,
      rolUsuario: actor.rol,
      contexto: 'UI — SIFYGSA Requisición (Oracle NetSuite)',
      tipoOperacion: 'Creación',
      campo: 'Estado de Aprobación',
      valorAnterior: '—',
      valorNuevo: ETIQUETAS_ESTADO_REQUISICION['solicitud'],
    },
  ];

  const nueva: Requisicion = {
    id: `req_${Date.now()}`,
    folio: folioGenerado,
    contrato: validado.contrato,
    tipoCompra: validado.tipoCompra ?? 'RQ - Requisición Operativa',
    subsidiaria: validado.subsidiaria ?? 'SIFYGSA',
    departamento: validado.departamento ?? `02 - ${validado.area}`,
    ubicacionAlmacen: validado.ubicacionAlmacen ?? 'ALM-CENTRAL-MAPACHAPA',
    comprador: validado.comprador ?? '— Seleccionar Comprador Asignado —',
    lugarEntrega: validado.lugarEntrega ?? 'Base de Operaciones Mapachapa / Refinería Tula',
    estadoDocumento: validado.estadoDocumento ?? 'A Revisar',
    solicitanteId: idSolicitante,
    solicitante: nombreSolicitante,
    area: validado.area,
    descripcion: validado.descripcion ?? validado.lugarEntrega ?? validado.justificacion,
    prioridad: validado.prioridad,
    estado: 'solicitud',
    justificacion: validado.justificacion,
    fechaCreacion: ahora,
    fechaRequerida: validado.fechaRequerida,
    partidas,
    subtotal,
    iva,
    total,
    nivelAprobacionRequerido: nivel.nivel,
    historial: [
      {
        id: `hist_${Date.now()}`,
        fecha: ahora,
        estadoAnterior: null,
        estadoNuevo: 'solicitud',
        usuarioNombre: nombreSolicitante,
        rolUsuario: actor.rol,
        comentario: `Creación y registro inicial de la requisición ${folioGenerado}. Notificado a Revisión (Compras y Gerencia).`,
      },
    ],
    bitacoraNetSuite: notasInicialesNetSuite,
  };

  await repositorioRequisiciones.guardarTodas([nueva, ...actuales]);

  await registrarAccionUsuario({
    usuarioId: actor.sub,
    usuarioNombre: actor.nombre,
    rol: actor.rol,
    modulo: 'requisiciones',
    tipoEvento: 'creacion',
    entidad: 'Requisición',
    entidadId: nueva.folio,
    detalle: `Nueva requisición ${nueva.folio} creada en estado "solicitud" por $${nueva.total.toLocaleString('es-MX')} MXN (${nueva.area}).`,
  });

  return nueva;
}

/**
 * Actualiza los campos de una requisición existente y registra cada cambio
 * campo por campo en la bitácora estilo Oracle NetSuite (System Notes) y en auditoría.
 */
export async function actualizarRequisicionConBitacora(
  id: string,
  entrada: EntradaActualizarRequisicion,
  actor: PayloadSesion
): Promise<Requisicion> {
  const validado = esquemaActualizarRequisicion.parse(entrada);
  const actuales = await repositorioRequisiciones.listarTodas();
  const actual = actuales.find((r) => r.id === id);

  if (!actual) {
    throw new Error('La requisición solicitada no existe.');
  }

  const matriz = await obtenerMatrizPermisos();
  const puedeEditarGlobal =
    tienePermiso(actor.rol, 'requisiciones', 'editar', actor.modulosPermitidos, matriz) ||
    tienePermiso(actor.rol, 'requisiciones', 'aprobar', actor.modulosPermitidos, matriz);
  const esSolicitante = esPropietarioRequisicion(actual, actor);

  if (!puedeEditarGlobal && !esSolicitante) {
    throw new ErrorAutorizacion('No tienes permiso para modificar esta requisición.');
  }

  if (
    !puedeEditarGlobal &&
    actual.estado !== 'solicitud' &&
    actual.estado !== 'revision'
  ) {
    throw new Error(
      'Solo puedes modificar tu requisición mientras aún no haya sido aprobada.'
    );
  }

  const ahora = new Date().toISOString();
  const nuevasNotas: NotaSistemaRequisicion[] = [];

  const registrarCambioCampo = (
    etiquetaCampo: string,
    anterior: string | undefined,
    nuevo: string | undefined
  ) => {
    const valAnt = (anterior ?? '—').trim();
    const valNvo = (nuevo ?? '—').trim();
    if (valNvo && valAnt !== valNvo) {
      nuevasNotas.push({
        id: `ns_${Date.now()}_${nuevasNotas.length + 1}`,
        fecha: ahora,
        usuarioNombre: actor.nombre,
        rolUsuario: actor.rol,
        contexto: 'UI — SIFYGSA Requisición (Oracle NetSuite)',
        tipoOperacion: 'Modificación',
        campo: etiquetaCampo,
        valorAnterior: valAnt,
        valorNuevo: valNvo,
      });
    }
  };

  if (validado.contrato !== undefined) {
    registrarCambioCampo('Número de Contrato', actual.contrato, validado.contrato);
  }
  if (validado.tipoCompra !== undefined) {
    registrarCambioCampo('Tipo de Compra', actual.tipoCompra ?? 'RQ - Requisición Operativa', validado.tipoCompra);
  }
  if (validado.subsidiaria !== undefined) {
    registrarCambioCampo('Subsidiaria', actual.subsidiaria ?? 'SIFYGSA', validado.subsidiaria);
  }
  if (validado.departamento !== undefined) {
    registrarCambioCampo('Departamento', actual.departamento ?? `02 - ${actual.area}`, validado.departamento);
  }
  if (validado.ubicacionAlmacen !== undefined) {
    registrarCambioCampo('Ubicación Almacén', actual.ubicacionAlmacen ?? 'ALM-CENTRAL-MAPACHAPA', validado.ubicacionAlmacen);
  }
  if (validado.estadoDocumento !== undefined) {
    registrarCambioCampo('Estado del Documento', actual.estadoDocumento ?? 'A Revisar', validado.estadoDocumento);
  }
  if (validado.comprador !== undefined) {
    registrarCambioCampo('Comprador Asignado', actual.comprador ?? '—', validado.comprador);
  }
  if (validado.fechaRequerida !== undefined) {
    registrarCambioCampo('Fecha de Entrega del Material', actual.fechaRequerida, validado.fechaRequerida);
  }
  if (validado.lugarEntrega !== undefined) {
    registrarCambioCampo('Lugar de Entrega', actual.lugarEntrega ?? '—', validado.lugarEntrega);
  }
  if (validado.justificacion !== undefined) {
    registrarCambioCampo('Nota / Justificación', actual.justificacion, validado.justificacion);
  }
  if (validado.prioridad !== undefined) {
    registrarCambioCampo('Prioridad de Suministro', actual.prioridad.toUpperCase(), validado.prioridad.toUpperCase());
  }
  if (validado.area !== undefined) {
    registrarCambioCampo('Área Operativa', actual.area, validado.area);
  }

  let partidasActualizadas = actual.partidas;
  let subtotal = actual.subtotal;
  let iva = actual.iva;
  let total = actual.total;
  let nivelAprobacionRequerido = actual.nivelAprobacionRequerido;

  if (validado.partidas && validado.partidas.length > 0) {
    partidasActualizadas = validado.partidas.map((p, idx) => ({
      ...p,
      id: `part_${Date.now()}_${idx}`,
      subtotal: Number((p.cantidad * p.precioUnitario).toFixed(2)),
    }));
    subtotal = Number(partidasActualizadas.reduce((s, p) => s + p.subtotal, 0).toFixed(2));
    iva = Number((subtotal * 0.16).toFixed(2));
    total = Number((subtotal + iva).toFixed(2));
    nivelAprobacionRequerido = determinarNivelAprobacion(total).nivel;

    const resumenAnt = `$${actual.total.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN (${actual.partidas.length} línea(s))`;
    const resumenNvo = `$${total.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN (${partidasActualizadas.length} línea(s))`;
    if (resumenAnt !== resumenNvo || JSON.stringify(actual.partidas.map((x) => `${x.codigoArticulo}:${x.cantidad}:${x.precioUnitario}`)) !== JSON.stringify(partidasActualizadas.map((x) => `${x.codigoArticulo}:${x.cantidad}:${x.precioUnitario}`))) {
      registrarCambioCampo('Líneas de Artículos / Importe Total', resumenAnt, resumenNvo);
    }
  }

  if (nuevasNotas.length === 0) {
    nuevasNotas.push({
      id: `ns_${Date.now()}_sync`,
      fecha: ahora,
      usuarioNombre: actor.nombre,
      rolUsuario: actor.rol,
      contexto: 'UI — SIFYGSA Requisición (Oracle NetSuite)',
      tipoOperacion: 'Modificación',
      campo: 'Guardado / Validación de Registro',
      valorAnterior: actual.folio,
      valorNuevo: `${actual.folio} (Sin cambios en importes)`,
    });
  }

  const resumenCampos = nuevasNotas.map((n) => `${n.campo}: "${n.valorAnterior}" → "${n.valorNuevo}"`).join('; ');

  const nuevoEventoHistorial = {
    id: `hist_${Date.now()}`,
    fecha: ahora,
    estadoAnterior: actual.estado,
    estadoNuevo: actual.estado,
    usuarioNombre: actor.nombre,
    rolUsuario: actor.rol,
    comentario: `Actualización en formulario NetSuite (${ resResumenCorto(resumenCampos) })`,
  };

  const actualizada: Requisicion = {
    ...actual,
    contrato: validado.contrato ?? actual.contrato,
    tipoCompra: validado.tipoCompra ?? actual.tipoCompra,
    subsidiaria: validado.subsidiaria ?? actual.subsidiaria,
    departamento: validado.departamento ?? actual.departamento,
    ubicacionAlmacen: validado.ubicacionAlmacen ?? actual.ubicacionAlmacen,
    comprador: validado.comprador ?? actual.comprador,
    lugarEntrega: validado.lugarEntrega ?? actual.lugarEntrega,
    estadoDocumento: validado.estadoDocumento ?? actual.estadoDocumento,
    area: validado.area ?? actual.area,
    descripcion: validado.descripcion ?? actual.descripcion,
    prioridad: validado.prioridad ?? actual.prioridad,
    justificacion: validado.justificacion ?? actual.justificacion,
    fechaRequerida: validado.fechaRequerida ?? actual.fechaRequerida,
    partidas: partidasActualizadas,
    subtotal,
    iva,
    total,
    nivelAprobacionRequerido,
    historial: [nuevoEventoHistorial, ...actual.historial],
    bitacoraNetSuite: [...nuevasNotas, ...(actual.bitacoraNetSuite ?? [])],
  };

  await repositorioRequisiciones.guardarTodas(
    actuales.map((r) => (r.id === id ? actualizada : r))
  );

  await registrarAccionUsuario({
    usuarioId: actor.sub,
    usuarioNombre: actor.nombre,
    rol: actor.rol,
    modulo: 'requisiciones',
    tipoEvento: 'actualizacion',
    entidad: 'Requisición',
    entidadId: actualizada.folio,
    detalle: `Modificación en requisición ${actualizada.folio}: ${resResumenCorto(resumenCampos)}`,
  });

  return actualizada;
}

function resResumenCorto(texto: string): string {
  return texto.length > 180 ? `${texto.slice(0, 177)}...` : texto;
}

export async function avanzarEstadoRequisicion(
  id: string,
  entrada: EntradaTransicionRequisicion,
  actor: PayloadSesion
): Promise<Requisicion> {
  const validado = esquemaTransicionRequisicion.parse(entrada);
  const actuales = await repositorioRequisiciones.listarTodas();
  const actual = actuales.find((r) => r.id === id);

  if (!actual) {
    throw new Error('La requisición solicitada no existe.');
  }

  const matriz = await obtenerMatrizPermisos();
  const puedeGestionarFlujo =
    tienePermiso(actor.rol, 'requisiciones', 'aprobar', actor.modulosPermitidos, matriz) ||
    tienePermiso(actor.rol, 'requisiciones', 'editar', actor.modulosPermitidos, matriz);

  if (validado.nuevoEstado === 'cancelada') {
    const esSolicitante = esPropietarioRequisicion(actual, actor);
    if (!esSolicitante && actor.rol !== 'administrador') {
      throw new ErrorAutorizacion(
        'Solo la persona solicitante puede cancelar su propia requisición.'
      );
    }
    if (actual.estado !== 'solicitud' && actual.estado !== 'revision') {
      throw new Error(
        `No es posible cancelar la requisición porque ya se encuentra en "${ETIQUETAS_ESTADO_REQUISICION[actual.estado]}".`
      );
    }
  } else {
    if (!puedeGestionarFlujo) {
      throw new ErrorAutorizacion(
        'Tu rol no tiene permisos para revisar, aprobar, rechazar o atender requisiciones.'
      );
    }
  }

  const permitidos = TRANSICIONES_VALIDAS[actual.estado] ?? [];
  if (!permitidos.includes(validado.nuevoEstado)) {
    throw new Error(
      `Transición inválida de "${ETIQUETAS_ESTADO_REQUISICION[actual.estado]}" a "${ETIQUETAS_ESTADO_REQUISICION[validado.nuevoEstado]}".`
    );
  }

  if (actual.estado === 'aprobacion' && validado.nuevoEstado === 'atencion') {
    const infoNivel =
      NIVELES_APROBACION_MONTO.find((n) => n.nivel === actual.nivelAprobacionRequerido) ??
      NIVELES_APROBACION_MONTO[2];

    if (!infoNivel.rolesAutorizados.includes(actor.rol)) {
      throw new ErrorAutorizacion(
        `El monto ($${actual.total.toLocaleString('es-MX')} MXN) requiere ${infoNivel.etiqueta}. Tu rol (${actor.rol}) no puede autorizar este nivel.`
      );
    }
  }

  const ahora = new Date().toISOString();
  const cambio = {
    id: `hist_${Date.now()}`,
    fecha: ahora,
    estadoAnterior: actual.estado,
    estadoNuevo: validado.nuevoEstado,
    usuarioNombre: actor.nombre,
    rolUsuario: actor.rol,
    comentario: validado.comentario,
  };

  const notaNetSuite: NotaSistemaRequisicion = {
    id: `ns_${Date.now()}_estado`,
    fecha: ahora,
    usuarioNombre: actor.nombre,
    rolUsuario: actor.rol,
    contexto: 'Workflow de Aprobación (Oracle NetSuite)',
    tipoOperacion:
      validado.nuevoEstado === 'cancelada'
        ? 'Cancelación'
        : validado.nuevoEstado === 'atencion' || validado.nuevoEstado === 'cierre'
        ? 'Aprobación'
        : 'Cambio de Estado',
    campo: 'Estado de Aprobación',
    valorAnterior: ETIQUETAS_ESTADO_REQUISICION[actual.estado],
    valorNuevo: `${ETIQUETAS_ESTADO_REQUISICION[validado.nuevoEstado]} (${validado.comentario})`,
  };

  const actualizada: Requisicion = {
    ...actual,
    estado: validado.nuevoEstado,
    historial: [cambio, ...actual.historial],
    bitacoraNetSuite: [notaNetSuite, ...(actual.bitacoraNetSuite ?? [])],
  };

  await repositorioRequisiciones.guardarTodas(
    actuales.map((r) => (r.id === id ? actualizada : r))
  );

  await registrarAccionUsuario({
    usuarioId: actor.sub,
    usuarioNombre: actor.nombre,
    rol: actor.rol,
    modulo: 'requisiciones',
    tipoEvento:
      validado.nuevoEstado === 'rechazada' || validado.nuevoEstado === 'cancelada'
        ? 'rechazo'
        : actual.estado === 'aprobacion'
        ? 'aprobacion'
        : 'actualizacion',
    entidad: 'Requisición',
    entidadId: actualizada.folio,
    detalle: `Cambio de estado ${actual.estado} → ${validado.nuevoEstado}: ${validado.comentario}`,
  });

  return actualizada;
}
