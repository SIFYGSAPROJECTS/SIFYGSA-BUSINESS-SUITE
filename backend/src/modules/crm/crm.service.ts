import { Injectable } from '@nestjs/common';
import {
  ZONAS_COMERCIALES,
  type PayloadSesion,
  type ZonaComercial,
} from '../../common/types/erp.types';
import { JsonStorageService } from '../../database/json-storage.service';
import { AuditService } from '../audit/audit.service';
import {
  ETAPAS_OPORTUNIDAD,
  PROBABILIDAD_POR_ETAPA,
  esquemaCrearActividadCrm,
  esquemaCrearCliente,
  esquemaCrearOportunidad,
  type ActividadCrm,
  type ClienteCrm,
  type DatosCrm,
  type EstadoActividadCrm,
  type EtapaOportunidad,
  type OportunidadCrm,
  type TipoActividadCrm,
} from './crm.schemas';

const ARCHIVO_CRM = 'crm.json';

@Injectable()
export class CrmService {
  constructor(
    private readonly jsonStorage: JsonStorageService,
    private readonly auditService: AuditService
  ) {}

  async obtenerDatosCrm(): Promise<DatosCrm> {
    return this.jsonStorage.leerJson<DatosCrm>(ARCHIVO_CRM, {
      oportunidades: [],
      clientes: [],
      actividades: [],
    });
  }

  calcularMetricas(
    oportunidades: OportunidadCrm[],
    zonaFiltro?: ZonaComercial | 'todas'
  ) {
    const lista =
      zonaFiltro && zonaFiltro !== 'todas'
        ? oportunidades.filter((o) => o.zona === zonaFiltro)
        : oportunidades;

    const totalOportunidades = lista.length;
    const valorPipelineActivo = lista
      .filter((o) => o.etapa !== 'ganado' && o.etapa !== 'perdido')
      .reduce((acc, o) => acc + o.montoEstimado, 0);

    const ganadas = lista.filter((o) => o.etapa === 'ganado');
    const valorGanadoTotal = ganadas.reduce((acc, o) => acc + o.montoEstimado, 0);
    const tasaConversion =
      totalOportunidades > 0
        ? Number(((ganadas.length / totalOportunidades) * 100).toFixed(1))
        : 0;

    const porEtapa = ETAPAS_OPORTUNIDAD.map((etapa) => {
      const items = lista.filter((o) => o.etapa === etapa);
      return {
        etapa,
        cantidad: items.length,
        monto: items.reduce((s, o) => s + o.montoEstimado, 0),
      };
    });

    const vendedoresUnicos = Array.from(new Set(lista.map((o) => o.vendedor)));
    const ventasPorVendedor = vendedoresUnicos.map((vendedor) => {
      const delVendedor = lista.filter((o) => o.vendedor === vendedor);
      return {
        vendedor,
        ganado: delVendedor
          .filter((o) => o.etapa === 'ganado')
          .reduce((s, o) => s + o.montoEstimado, 0),
        pipeline: delVendedor
          .filter((o) => o.etapa !== 'ganado' && o.etapa !== 'perdido')
          .reduce((s, o) => s + o.montoEstimado, 0),
        oportunidades: delVendedor.length,
      };
    });

    const ventasPorZona = ZONAS_COMERCIALES.map((zona) => {
      const deZona = lista.filter((o) => o.zona === zona);
      return {
        zona,
        ganado: deZona
          .filter((o) => o.etapa === 'ganado')
          .reduce((s, o) => s + o.montoEstimado, 0),
        pipeline: deZona
          .filter((o) => o.etapa !== 'ganado' && o.etapa !== 'perdido')
          .reduce((s, o) => s + o.montoEstimado, 0),
        oportunidades: deZona.length,
      };
    }).filter((z) => z.oportunidades > 0);

    const periodosUnicos = Array.from(new Set(lista.map((o) => o.periodo))).sort();
    const ventasPorPeriodo = periodosUnicos.map((periodo) => {
      const delPeriodo = lista.filter((o) => o.periodo === periodo);
      return {
        periodo,
        ganado: delPeriodo
          .filter((o) => o.etapa === 'ganado')
          .reduce((s, o) => s + o.montoEstimado, 0),
        proyectado: delPeriodo
          .filter((o) => o.etapa !== 'perdido')
          .reduce((s, o) => s + (o.montoEstimado * o.probabilidad) / 100, 0),
      };
    });

    return {
      totalOportunidades,
      valorPipelineActivo,
      valorGanadoTotal,
      tasaConversion,
      porEtapa,
      ventasPorVendedor,
      ventasPorZona,
      ventasPorPeriodo,
    };
  }

  async crearOportunidad(entrada: unknown, actor: PayloadSesion): Promise<OportunidadCrm> {
    const validado = esquemaCrearOportunidad.parse(entrada);
    const actual = await this.obtenerDatosCrm();
    const consecutivo = actual.oportunidades.length + 45;

    const nueva: OportunidadCrm = {
      ...validado,
      id: `opp_${Date.now()}`,
      folio: `OPP-2026-${String(consecutivo).padStart(3, '0')}`,
      probabilidad: validado.probabilidad ?? PROBABILIDAD_POR_ETAPA[validado.etapa],
      actualizadoEn: new Date().toISOString(),
    };

    await this.jsonStorage.actualizarJson<DatosCrm>(
      ARCHIVO_CRM,
      { oportunidades: [], clientes: [], actividades: [] },
      (prev) => ({ ...prev, oportunidades: [nueva, ...prev.oportunidades] })
    );

    await this.auditService.registrarAccionSegura({
      usuarioId: actor.sub,
      usuarioNombre: actor.nombre,
      rol: actor.rol,
      modulo: 'crm',
      tipoEvento: 'creacion',
      entidad: 'Oportunidad',
      entidadId: nueva.folio,
      detalle: `Creación de oportunidad "${nueva.titulo}" para ${nueva.clienteNombre} ($${nueva.montoEstimado.toLocaleString('es-MX')}).`,
    });

    return nueva;
  }

  async actualizarEtapaOportunidad(
    idOportunidad: string,
    nuevaEtapa: EtapaOportunidad,
    actor: PayloadSesion
  ): Promise<OportunidadCrm> {
    let modificada: OportunidadCrm | null = null;

    await this.jsonStorage.actualizarJson<DatosCrm>(
      ARCHIVO_CRM,
      { oportunidades: [], clientes: [], actividades: [] },
      (prev) => ({
        ...prev,
        oportunidades: prev.oportunidades.map((opp) => {
          if (opp.id === idOportunidad) {
            modificada = {
              ...opp,
              etapa: nuevaEtapa,
              probabilidad: PROBABILIDAD_POR_ETAPA[nuevaEtapa],
              actualizadoEn: new Date().toISOString(),
            };
            return modificada;
          }
          return opp;
        }),
      })
    );

    if (!modificada) {
      throw new Error('Oportunidad no encontrada.');
    }

    const oppFinal = modificada as OportunidadCrm;
    await this.auditService.registrarAccionSegura({
      usuarioId: actor.sub,
      usuarioNombre: actor.nombre,
      rol: actor.rol,
      modulo: 'crm',
      tipoEvento: 'actualizacion',
      entidad: 'Oportunidad',
      entidadId: oppFinal.folio,
      detalle: `Movimiento Kanban de oportunidad ${oppFinal.folio} a etapa "${nuevaEtapa}".`,
    });

    return oppFinal;
  }

  async importarOportunidadesMasivas(
    filas: unknown[],
    actor: PayloadSesion
  ): Promise<{ importadas: number; errores: string[] }> {
    const actual = await this.obtenerDatosCrm();
    const nuevas: OportunidadCrm[] = [];
    const errores: string[] = [];

    filas.forEach((fila, idx) => {
      const resultado = esquemaCrearOportunidad.safeParse(fila);
      if (!resultado.success) {
        errores.push(
          `Fila ${idx + 1}: ${resultado.error.errors.map((e) => e.message).join(', ')}`
        );
        return;
      }
      const numFolio = actual.oportunidades.length + nuevas.length + 50;
      nuevas.push({
        ...resultado.data,
        id: `opp_imp_${Date.now()}_${idx}`,
        folio: `OPP-2026-${String(numFolio).padStart(3, '0')}`,
        actualizadoEn: new Date().toISOString(),
      });
    });

    if (nuevas.length > 0) {
      await this.jsonStorage.actualizarJson<DatosCrm>(
        ARCHIVO_CRM,
        { oportunidades: [], clientes: [], actividades: [] },
        (prev) => ({ ...prev, oportunidades: [...nuevas, ...prev.oportunidades] })
      );

      await this.auditService.registrarAccionSegura({
        usuarioId: actor.sub,
        usuarioNombre: actor.nombre,
        rol: actor.rol,
        modulo: 'crm',
        tipoEvento: 'creacion',
        entidad: 'Importación CRM',
        detalle: `Importación masiva de ${nuevas.length} oportunidades validadas con Zod.`,
      });
    }

    return { importadas: nuevas.length, errores };
  }

  async crearCliente(entrada: unknown, actor: PayloadSesion): Promise<ClienteCrm> {
    const validado = esquemaCrearCliente.parse(entrada);
    const nuevoCliente: ClienteCrm = {
      ...validado,
      id: `cli_${Date.now()}`,
      interacciones: [
        {
          id: `int_${Date.now()}`,
          fecha: new Date().toISOString(),
          tipo: 'tarea',
          autor: actor.nombre,
          resumen: 'Alta inicial de cliente y contacto en el expediente comercial.',
        },
      ],
    };

    await this.jsonStorage.actualizarJson<DatosCrm>(
      ARCHIVO_CRM,
      { oportunidades: [], clientes: [], actividades: [] },
      (prev) => ({ ...prev, clientes: [nuevoCliente, ...prev.clientes] })
    );

    await this.auditService.registrarAccionSegura({
      usuarioId: actor.sub,
      usuarioNombre: actor.nombre,
      rol: actor.rol,
      modulo: 'crm',
      tipoEvento: 'creacion',
      entidad: 'Cliente',
      entidadId: nuevoCliente.id,
      detalle: `Alta de cliente ${nuevoCliente.empresa} (${nuevoCliente.rfc}).`,
    });

    return nuevoCliente;
  }

  async registrarInteraccionCliente(
    clienteId: string,
    datos: { tipo: TipoActividadCrm; resumen: string },
    actor: PayloadSesion
  ): Promise<ClienteCrm> {
    let actualizado: ClienteCrm | null = null;

    await this.jsonStorage.actualizarJson<DatosCrm>(
      ARCHIVO_CRM,
      { oportunidades: [], clientes: [], actividades: [] },
      (prev) => ({
        ...prev,
        clientes: prev.clientes.map((c) => {
          if (c.id === clienteId) {
            actualizado = {
              ...c,
              interacciones: [
                {
                  id: `int_${Date.now()}`,
                  fecha: new Date().toISOString(),
                  tipo: datos.tipo,
                  autor: actor.nombre,
                  resumen: datos.resumen.trim(),
                },
                ...c.interacciones,
              ],
            };
            return actualizado;
          }
          return c;
        }),
      })
    );

    if (!actualizado) {
      throw new Error('Cliente no encontrado.');
    }

    return actualizado;
  }

  async crearActividad(entrada: unknown, actor: PayloadSesion): Promise<ActividadCrm> {
    const validado = esquemaCrearActividadCrm.parse(entrada);
    const nueva: ActividadCrm = {
      ...validado,
      id: `act_${Date.now()}`,
    };

    await this.jsonStorage.actualizarJson<DatosCrm>(
      ARCHIVO_CRM,
      { oportunidades: [], clientes: [], actividades: [] },
      (prev) => ({ ...prev, actividades: [nueva, ...prev.actividades] })
    );

    await this.auditService.registrarAccionSegura({
      usuarioId: actor.sub,
      usuarioNombre: actor.nombre,
      rol: actor.rol,
      modulo: 'crm',
      tipoEvento: 'creacion',
      entidad: 'Actividad CRM',
      entidadId: nueva.id,
      detalle: `Programación de ${nueva.tipo}: "${nueva.titulo}" para ${nueva.clienteNombre}.`,
    });

    return nueva;
  }

  async cambiarEstadoActividad(
    idActividad: string,
    nuevoEstado: EstadoActividadCrm
  ): Promise<ActividadCrm> {
    let actualizada: ActividadCrm | null = null;

    await this.jsonStorage.actualizarJson<DatosCrm>(
      ARCHIVO_CRM,
      { oportunidades: [], clientes: [], actividades: [] },
      (prev) => ({
        ...prev,
        actividades: prev.actividades.map((a) => {
          if (a.id === idActividad) {
            actualizada = { ...a, estado: nuevoEstado };
            return actualizada;
          }
          return a;
        }),
      })
    );

    if (!actualizada) {
      throw new Error('Actividad no encontrada.');
    }

    return actualizada;
  }
}
