import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import {
  NOMBRES_ROLES,
  type PayloadSesion,
  type ZonaComercial,
} from '../../common/types/erp.types';
import {
  AuditService,
  TIPOS_MOVIMIENTO_CRM,
  type TipoMovimientoCrm,
} from '../audit/audit.service';
import type {
  EstadoActividadCrm,
  EtapaOportunidad,
  TipoActividadCrm,
} from './crm.schemas';
import { CrmService } from './crm.service';

function obtenerIniciales(nombre: string): string {
  const partes = nombre
    .replace(/^(Ing\.|Lic\.|Arq\.|Mtro\.)\s+/i, '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (partes.length === 0) return 'SF';
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return `${partes[0][0]}${partes[1][0]}`.toUpperCase();
}

@ApiTags('CRM & Promesas')
@Controller('crm')
export class CrmController {
  constructor(
    private readonly crmService: CrmService,
    private readonly auditService: AuditService
  ) {}

  @Get()
  @RequirePermission('crm', 'ver')
  @ApiOperation({ summary: 'Obtiene oportunidades, clientes, actividades y métricas CRM' })
  async obtenerResumen(@Query('zona') zonaRaw?: string) {
    const zona = (zonaRaw ?? 'todas') as ZonaComercial | 'todas';
    const crm = await this.crmService.obtenerDatosCrm();
    const metricas = this.crmService.calcularMetricas(crm.oportunidades, zona);
    return {
      exito: true,
      datos: { crm, metricas },
    };
  }

  @Post('oportunidades')
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission('crm', 'crear')
  @ApiOperation({ summary: 'Crea una oportunidad comercial' })
  async crearOportunidad(@Body() cuerpo: unknown, @CurrentUser() actor: PayloadSesion) {
    const creada = await this.crmService.crearOportunidad(cuerpo, actor);
    return { exito: true, datos: creada };
  }

  @Patch('oportunidades')
  @RequirePermission('crm', 'editar')
  @ApiOperation({ summary: 'Actualiza la etapa de una oportunidad en Kanban' })
  async actualizarEtapa(
    @Body() cuerpo: { id: string; etapa: EtapaOportunidad },
    @CurrentUser() actor: PayloadSesion
  ) {
    const actualizada = await this.crmService.actualizarEtapaOportunidad(
      cuerpo.id,
      cuerpo.etapa,
      actor
    );
    return { exito: true, datos: actualizada };
  }

  @Put('oportunidades')
  @RequirePermission('crm', 'crear')
  @ApiOperation({ summary: 'Importación masiva de oportunidades CRM' })
  async importarMasivas(
    @Body() cuerpo: { filas?: unknown[] },
    @CurrentUser() actor: PayloadSesion
  ) {
    const resultado = await this.crmService.importarOportunidadesMasivas(
      cuerpo.filas ?? [],
      actor
    );
    return { exito: true, datos: resultado };
  }

  @Post('clientes')
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission('crm', 'crear')
  @ApiOperation({ summary: 'Registra un nuevo cliente industrial' })
  async crearCliente(@Body() cuerpo: unknown, @CurrentUser() actor: PayloadSesion) {
    const creado = await this.crmService.crearCliente(cuerpo, actor);
    return { exito: true, datos: creado };
  }

  @Patch('clientes')
  @RequirePermission('crm', 'editar')
  @ApiOperation({ summary: 'Registra una interacción comercial en un cliente' })
  async registrarInteraccion(
    @Body() cuerpo: { clienteId: string; tipo: TipoActividadCrm; resumen: string },
    @CurrentUser() actor: PayloadSesion
  ) {
    const actualizado = await this.crmService.registrarInteraccionCliente(
      cuerpo.clienteId,
      { tipo: cuerpo.tipo, resumen: cuerpo.resumen },
      actor
    );
    return { exito: true, datos: actualizado };
  }

  @Post('actividades')
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission('crm', 'crear')
  @ApiOperation({ summary: 'Crea una actividad o cita CRM' })
  async crearActividad(@Body() cuerpo: unknown, @CurrentUser() actor: PayloadSesion) {
    const creada = await this.crmService.crearActividad(cuerpo, actor);
    return { exito: true, datos: creada };
  }

  @Patch('actividades')
  @RequirePermission('crm', 'editar')
  @ApiOperation({ summary: 'Cambia el estado de una actividad CRM' })
  async cambiarEstadoActividad(
    @Body() cuerpo: { id: string; estado: EstadoActividadCrm }
  ) {
    const actualizada = await this.crmService.cambiarEstadoActividad(
      cuerpo.id,
      cuerpo.estado
    );
    return { exito: true, datos: actualizada };
  }

  @Get('ranking-clientes')
  @ApiOperation({
    summary:
      'Obtiene resumen de movimientos por folio en bitacora_crm_promesas para el ranking de clientes del dashboard',
  })
  async obtenerRankingClientes() {
    const resumen = await this.auditService.obtenerResumenMovimientosPromesas();
    return {
      exito: true,
      datos: resumen,
      origen: resumen.origen,
    };
  }

  @Get('bitacora-promesas')
  @ApiOperation({ summary: 'Obtiene el checador de movimientos por folio desde MongoDB Atlas' })
  async listarBitacoraPromesas(@Query('folio') folio?: string) {
    const folioLimpio = folio?.trim();
    if (!folioLimpio) {
      throw new BadRequestException('El parámetro folio es obligatorio.');
    }

    const resultado = await this.auditService.listarBitacoraPromesaPorFolio(folioLimpio);
    return {
      exito: true,
      datos: resultado.registros,
      origen: resultado.origen,
    };
  }

  @Post('bitacora-promesas')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Registra un movimiento, modificación o nota en bitacora_crm_promesas (MongoDB Atlas)',
  })
  async registrarBitacoraPromesa(
    @Body()
    body: {
      id?: string;
      folio?: string;
      nombrePromesa?: string;
      clientePromesa?: string;
      tipo?: TipoMovimientoCrm;
      titulo?: string;
      campoEtiqueta?: string;
      valorAnterior?: string;
      valorNuevo?: string;
      texto?: string;
      esBot?: boolean;
    },
    @CurrentUser() sesion: PayloadSesion
  ) {
    if (!body.folio || !body.texto) {
      throw new BadRequestException('folio y texto son campos requeridos.');
    }

    const tipoValido: TipoMovimientoCrm =
      body.tipo && TIPOS_MOVIMIENTO_CRM.includes(body.tipo) ? body.tipo : 'movement';
    const esBot = Boolean(body.esBot);

    const { registro, origen } = await this.auditService.registrarMovimientoPromesaCrm({
      id: body.id,
      folio: body.folio,
      nombrePromesa: body.nombrePromesa,
      clientePromesa: body.clientePromesa,
      usuarioId: sesion.sub,
      autor: esBot ? 'SIFYGSA Bot' : sesion.nombre,
      iniciales: esBot ? 'BOT' : obtenerIniciales(sesion.nombre),
      rolEtiqueta: esBot ? 'Auditoría Automática' : NOMBRES_ROLES[sesion.rol],
      tipo: tipoValido,
      titulo: body.titulo,
      campoEtiqueta: body.campoEtiqueta,
      valorAnterior: body.valorAnterior,
      valorNuevo: body.valorNuevo,
      texto: body.texto,
      esBot,
    });

    if (tipoValido === 'movement' || tipoValido === 'modification') {
      await this.auditService.registrarAccionSegura({
        usuarioId: sesion.sub,
        usuarioNombre: sesion.nombre,
        rol: sesion.rol,
        modulo: 'crm',
        tipoEvento: 'actualizacion',
        entidad: 'Promesa / Oportunidad CRM',
        entidadId: body.folio,
        detalle: body.campoEtiqueta
          ? `${body.campoEtiqueta}: "${body.valorAnterior ?? '-'}" → "${body.valorNuevo ?? '-'}" (${body.texto})`
          : body.texto,
      });
    }

    return { exito: true, datos: registro, origen };
  }
}
