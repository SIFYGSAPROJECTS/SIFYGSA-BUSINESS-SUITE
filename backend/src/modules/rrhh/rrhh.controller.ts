import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import type { PayloadSesion } from '../../common/types/erp.types';
import type { EstadoSolicitudRrhh } from './rrhh.schemas';
import { RrhhService } from './rrhh.service';

@ApiTags('RRHH & Capital Humano')
@Controller('rrhh')
export class RrhhController {
  constructor(private readonly rrhhService: RrhhService) {}

  @Get()
  @RequirePermission('rrhh', 'ver')
  @ApiOperation({ summary: 'Obtiene datos de RRHH con redacción automática de campos sensibles según rol' })
  async obtenerDatos(@CurrentUser() sesion: PayloadSesion) {
    const datos = await this.rrhhService.obtenerDatosSegurosPorRol(sesion.rol);
    return { exito: true, datos };
  }

  @Post('empleados')
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission('rrhh', 'crear')
  @ApiOperation({ summary: 'Registra un nuevo empleado en expediente RRHH' })
  async crearEmpleado(@Body() cuerpo: unknown, @CurrentUser() actor: PayloadSesion) {
    const creado = await this.rrhhService.crearEmpleado(cuerpo, actor);
    return { exito: true, datos: creado };
  }

  @Post('asistencia')
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission('rrhh', 'crear')
  @ApiOperation({ summary: 'Registra asistencia diaria de colaborador' })
  async registrarAsistencia(@Body() cuerpo: unknown, @CurrentUser() actor: PayloadSesion) {
    const creada = await this.rrhhService.registrarAsistencia(cuerpo, actor);
    return { exito: true, datos: creada };
  }

  @Post('incidencias')
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission('rrhh', 'crear')
  @ApiOperation({ summary: 'Registra una incidencia de RRHH o seguridad STPS' })
  async registrarIncidencia(@Body() cuerpo: unknown, @CurrentUser() actor: PayloadSesion) {
    const creada = await this.rrhhService.registrarIncidencia(cuerpo, actor);
    return { exito: true, datos: creada };
  }

  @Post('vacaciones')
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission('rrhh', 'crear')
  @ApiOperation({ summary: 'Crea una solicitud de vacaciones o permiso' })
  async crearVacaciones(@Body() cuerpo: unknown, @CurrentUser() actor: PayloadSesion) {
    const creada = await this.rrhhService.crearSolicitudVacaciones(cuerpo, actor);
    return { exito: true, datos: creada };
  }

  @Patch('vacaciones')
  @RequirePermission('rrhh', 'aprobar')
  @ApiOperation({ summary: 'Aprueba o rechaza una solicitud de vacaciones/permiso' })
  async dictaminarVacaciones(
    @Body() cuerpo: { id: string; estado: EstadoSolicitudRrhh },
    @CurrentUser() actor: PayloadSesion
  ) {
    const actualizada = await this.rrhhService.dictaminarVacaciones(
      cuerpo.id,
      cuerpo.estado,
      actor
    );
    return { exito: true, datos: actualizada };
  }
}
