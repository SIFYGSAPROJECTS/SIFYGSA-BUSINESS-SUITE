import { Injectable } from '@nestjs/common';
import {
  MATRIZ_PERMISOS_POR_DEFECTO,
  tienePermiso,
} from '../../common/constants/permissions.matrix';
import {
  ErrorAutorizacion,
  type MatrizPermisos,
  type PayloadSesion,
} from '../../common/types/erp.types';
import { JsonStorageService } from '../../database/json-storage.service';
import { AuditService } from '../audit/audit.service';
import {
  ETIQUETAS_ESTADO_REQUISICION,
  LIMITE_REQUISICIONES_POR_HORA,
  NIVELES_APROBACION_MONTO,
  determinarNivelAprobacion,
  esquemaActualizarRequisicion,
  esquemaCrearRequisicion,
  esquemaTransicionRequisicion,
  type EstadoRequisicion,
  type NotaSistemaRequisicion,
  type Requisicion,
} from './requisiciones.schemas';

const ARCHIVO_REQUISICIONES = 'requisiciones.json';

const TRANSICIONES_VALIDAS: Record<EstadoRequisicion, EstadoRequisicion[]> = {
  solicitud: ['revision', 'rechazada', 'cancelada'],
  revision: ['aprobacion', 'rechazada', 'cancelada'],
  aprobacion: ['atencion', 'rechazada'],
  atencion: ['cierre'],
  cierre: [],
  rechazada: ['solicitud'],
  cancelada: [],
};

function resumenCorto(texto: string): string {
  return texto.length > 180 ? `${texto.slice(0, 177)}...` : texto;
}

@Injectable()
export class RequisicionesService {
  constructor(
    private readonly jsonStorage: JsonStorageService,
    private readonly auditService: AuditService
  ) {}

  private esPropietario(req: Requisicion, actor: PayloadSesion): boolean {
    if (req.solicitanteId && req.solicitanteId === actor.sub) {
      return true;
    }
    return req.solicitante.trim().toLowerCase() === actor.nombre.trim().toLowerCase();
  }

  private async obtenerMatriz(): Promise<MatrizPermisos> {
    return this.jsonStorage.leerJson<MatrizPermisos>(
      'roles-permisos.json',
      MATRIZ_PERMISOS_POR_DEFECTO
    );
  }

  async listarParaUsuario(actor: PayloadSesion): Promise<Requisicion[]> {
    const matriz = await this.obtenerMatriz();
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

    const todas = await this.jsonStorage.leerJson<Requisicion[]>(ARCHIVO_REQUISICIONES, []);
    return puedeVerTodas ? todas : todas.filter((r) => this.esPropietario(r, actor));
  }

  async crear(entrada: unknown, actor: PayloadSesion): Promise<Requisicion> {
    const validado = esquemaCrearRequisicion.parse(entrada);
    const actuales = await this.jsonStorage.leerJson<Requisicion[]>(ARCHIVO_REQUISICIONES, []);

    const haceUnaHoraMs = Date.now() - 60 * 60 * 1000;
    const creadasUltimaHora = actuales.filter((r) => {
      const fechaMs = new Date(r.fechaCreacion).getTime();
      return !Number.isNaN(fechaMs) && fechaMs >= haceUnaHoraMs && this.esPropietario(r, actor);
    });

    if (creadasUltimaHora.length >= LIMITE_REQUISICIONES_POR_HORA) {
      throw new Error(
        `Límite alcanzado: máximo ${LIMITE_REQUISICIONES_POR_HORA} requisiciones por hora por usuario.`
      );
    }

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
    const folioGenerado = `SFG-${validado.contrato.slice(0, 9).toUpperCase()}-RQ-${actuales.length + 81}/26`;

    const notasIniciales: NotaSistemaRequisicion[] = [
      {
        id: `ns_${Date.now()}_1`,
        fecha: ahora,
        usuarioNombre: actor.nombre,
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
        usuarioNombre: actor.nombre,
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
        usuarioNombre: actor.nombre,
        rolUsuario: actor.rol,
        contexto: 'UI — SIFYGSA Requisición (Oracle NetSuite)',
        tipoOperacion: 'Creación',
        campo: 'Estado de Aprobación',
        valorAnterior: '—',
        valorNuevo: ETIQUETAS_ESTADO_REQUISICION.solicitud,
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
      solicitanteId: actor.sub,
      solicitante: actor.nombre,
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
          usuarioNombre: actor.nombre,
          rolUsuario: actor.rol,
          comentario: `Creación y registro inicial de la requisición ${folioGenerado}.`,
        },
      ],
      bitacoraNetSuite: notasIniciales,
    };

    await this.jsonStorage.escribirJson<Requisicion[]>(ARCHIVO_REQUISICIONES, [nueva, ...actuales]);

    await this.auditService.registrarAccionSegura({
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

  async actualizarConBitacora(
    id: string,
    entrada: unknown,
    actor: PayloadSesion
  ): Promise<Requisicion> {
    const validado = esquemaActualizarRequisicion.parse(entrada);
    const actuales = await this.jsonStorage.leerJson<Requisicion[]>(ARCHIVO_REQUISICIONES, []);
    const actual = actuales.find((r) => r.id === id);

    if (!actual) {
      throw new Error('La requisición solicitada no existe.');
    }

    const matriz = await this.obtenerMatriz();
    const puedeEditarGlobal =
      tienePermiso(actor.rol, 'requisiciones', 'editar', actor.modulosPermitidos, matriz) ||
      tienePermiso(actor.rol, 'requisiciones', 'aprobar', actor.modulosPermitidos, matriz);

    if (!puedeEditarGlobal && !this.esPropietario(actual, actor)) {
      throw new ErrorAutorizacion('No tienes permiso para modificar esta requisición.');
    }

    if (!puedeEditarGlobal && actual.estado !== 'solicitud' && actual.estado !== 'revision') {
      throw new Error('Solo puedes modificar tu requisición mientras aún no haya sido aprobada.');
    }

    const ahora = new Date().toISOString();
    const nuevasNotas: NotaSistemaRequisicion[] = [];

    const registrarCambio = (campo: string, ant?: string, nvo?: string) => {
      const a = (ant ?? '—').trim();
      const b = (nvo ?? '—').trim();
      if (b && a !== b) {
        nuevasNotas.push({
          id: `ns_${Date.now()}_${nuevasNotas.length + 1}`,
          fecha: ahora,
          usuarioNombre: actor.nombre,
          rolUsuario: actor.rol,
          contexto: 'UI — SIFYGSA Requisición (Oracle NetSuite)',
          tipoOperacion: 'Modificación',
          campo,
          valorAnterior: a,
          valorNuevo: b,
        });
      }
    };

    if (validado.contrato !== undefined) registrarCambio('Número de Contrato', actual.contrato, validado.contrato);
    if (validado.tipoCompra !== undefined) registrarCambio('Tipo de Compra', actual.tipoCompra, validado.tipoCompra);
    if (validado.subsidiaria !== undefined) registrarCambio('Subsidiaria', actual.subsidiaria, validado.subsidiaria);
    if (validado.departamento !== undefined) registrarCambio('Departamento', actual.departamento, validado.departamento);
    if (validado.ubicacionAlmacen !== undefined) registrarCambio('Ubicación Almacén', actual.ubicacionAlmacen, validado.ubicacionAlmacen);
    if (validado.estadoDocumento !== undefined) registrarCambio('Estado del Documento', actual.estadoDocumento, validado.estadoDocumento);
    if (validado.comprador !== undefined) registrarCambio('Comprador Asignado', actual.comprador, validado.comprador);
    if (validado.fechaRequerida !== undefined) registrarCambio('Fecha de Entrega del Material', actual.fechaRequerida, validado.fechaRequerida);
    if (validado.lugarEntrega !== undefined) registrarCambio('Lugar de Entrega', actual.lugarEntrega, validado.lugarEntrega);
    if (validado.justificacion !== undefined) registrarCambio('Nota / Justificación', actual.justificacion, validado.justificacion);
    if (validado.prioridad !== undefined) registrarCambio('Prioridad de Suministro', actual.prioridad.toUpperCase(), validado.prioridad.toUpperCase());
    if (validado.area !== undefined) registrarCambio('Área Operativa', actual.area, validado.area);

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
      registrarCambio(
        'Líneas de Artículos / Importe Total',
        `$${actual.total.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN (${actual.partidas.length} línea(s))`,
        `$${total.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN (${partidasActualizadas.length} línea(s))`
      );
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

    const resumenCampos = nuevasNotas
      .map((n) => `${n.campo}: "${n.valorAnterior}" → "${n.valorNuevo}"`)
      .join('; ');

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
      historial: [
        {
          id: `hist_${Date.now()}`,
          fecha: ahora,
          estadoAnterior: actual.estado,
          estadoNuevo: actual.estado,
          usuarioNombre: actor.nombre,
          rolUsuario: actor.rol,
          comentario: `Actualización en formulario (${resumenCorto(resumenCampos)})`,
        },
        ...actual.historial,
      ],
      bitacoraNetSuite: [...nuevasNotas, ...(actual.bitacoraNetSuite ?? [])],
    };

    await this.jsonStorage.escribirJson<Requisicion[]>(
      ARCHIVO_REQUISICIONES,
      actuales.map((r) => (r.id === id ? actualizada : r))
    );

    await this.auditService.registrarAccionSegura({
      usuarioId: actor.sub,
      usuarioNombre: actor.nombre,
      rol: actor.rol,
      modulo: 'requisiciones',
      tipoEvento: 'actualizacion',
      entidad: 'Requisición',
      entidadId: actualizada.folio,
      detalle: `Modificación en requisición ${actualizada.folio}: ${resumenCorto(resumenCampos)}`,
    });

    return actualizada;
  }

  async avanzarEstado(id: string, entrada: unknown, actor: PayloadSesion): Promise<Requisicion> {
    const validado = esquemaTransicionRequisicion.parse(entrada);
    const actuales = await this.jsonStorage.leerJson<Requisicion[]>(ARCHIVO_REQUISICIONES, []);
    const actual = actuales.find((r) => r.id === id);

    if (!actual) {
      throw new Error('La requisición solicitada no existe.');
    }

    const matriz = await this.obtenerMatriz();
    const puedeGestionar =
      tienePermiso(actor.rol, 'requisiciones', 'aprobar', actor.modulosPermitidos, matriz) ||
      tienePermiso(actor.rol, 'requisiciones', 'editar', actor.modulosPermitidos, matriz);

    if (validado.nuevoEstado === 'cancelada') {
      if (!this.esPropietario(actual, actor) && actor.rol !== 'administrador') {
        throw new ErrorAutorizacion(
          'Solo la persona solicitante puede cancelar su propia requisición.'
        );
      }
      if (actual.estado !== 'solicitud' && actual.estado !== 'revision') {
        throw new Error(
          `No es posible cancelar la requisición porque ya se encuentra en "${ETIQUETAS_ESTADO_REQUISICION[actual.estado]}".`
        );
      }
    } else if (!puedeGestionar) {
      throw new ErrorAutorizacion(
        'Tu rol no tiene permisos para revisar, aprobar, rechazar o atender requisiciones.'
      );
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
    const actualizada: Requisicion = {
      ...actual,
      estado: validado.nuevoEstado,
      historial: [
        {
          id: `hist_${Date.now()}`,
          fecha: ahora,
          estadoAnterior: actual.estado,
          estadoNuevo: validado.nuevoEstado,
          usuarioNombre: actor.nombre,
          rolUsuario: actor.rol,
          comentario: validado.comentario,
        },
        ...actual.historial,
      ],
      bitacoraNetSuite: [
        {
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
        },
        ...(actual.bitacoraNetSuite ?? []),
      ],
    };

    await this.jsonStorage.escribirJson<Requisicion[]>(
      ARCHIVO_REQUISICIONES,
      actuales.map((r) => (r.id === id ? actualizada : r))
    );

    await this.auditService.registrarAccionSegura({
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
}
