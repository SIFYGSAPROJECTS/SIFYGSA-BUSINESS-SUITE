import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import {
  IDS_MODULOS,
  TIPOS_EVENTO_AUDITORIA,
  type IdModulo,
  type PayloadSesion,
  type TipoEventoAuditoria,
} from '../../common/types/erp.types';
import { AuditService } from '../audit/audit.service';
import { AdminService } from './admin.service';

@ApiTags('Admin & Auditoría')
@Controller('admin')
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly auditService: AuditService
  ) {}

  @Get('usuarios')
  @RequirePermission('admin', 'ver')
  @ApiOperation({ summary: 'Lista todos los usuarios sin contraseña' })
  async listarUsuarios() {
    const usuarios = await this.adminService.listarUsuariosPublicos();
    return { exito: true, datos: usuarios };
  }

  @Post('usuarios')
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission('admin', 'crear')
  @ApiOperation({ summary: 'Crea un nuevo usuario corporativo con bcrypt' })
  async crearUsuario(@Body() cuerpo: unknown, @CurrentUser() actor: PayloadSesion) {
    const creado = await this.adminService.crearNuevoUsuario(cuerpo, actor);
    return { exito: true, datos: creado };
  }

  @Put('usuarios/:id')
  @RequirePermission('admin', 'editar')
  @ApiOperation({ summary: 'Actualiza datos y permisos de un usuario' })
  async editarUsuario(
    @Param('id') id: string,
    @Body() cuerpo: unknown,
    @CurrentUser() actor: PayloadSesion
  ) {
    const actualizado = await this.adminService.editarUsuarioExistente(id, cuerpo, actor);
    return { exito: true, datos: actualizado };
  }

  @Patch('usuarios/:id')
  @RequirePermission('admin', 'editar')
  @ApiOperation({ summary: 'Restablece la contraseña de un usuario' })
  async restablecerPassword(
    @Param('id') id: string,
    @Body() cuerpo: { nuevaPassword: string },
    @CurrentUser() actor: PayloadSesion
  ) {
    await this.adminService.restablecerPasswordUsuario(id, cuerpo.nuevaPassword, actor);
    return {
      exito: true,
      mensaje: 'Contraseña restablecida correctamente.',
    };
  }

  @Get('permisos')
  @RequirePermission('admin', 'ver')
  @ApiOperation({ summary: 'Obtiene la matriz RBAC de roles y permisos' })
  async obtenerPermisos() {
    const matriz = await this.adminService.obtenerMatrizPermisos();
    return { exito: true, datos: matriz };
  }

  @Put('permisos')
  @RequirePermission('admin', 'editar')
  @ApiOperation({ summary: 'Actualiza la matriz RBAC de roles y permisos' })
  async actualizarPermisos(@Body() cuerpo: unknown, @CurrentUser() actor: PayloadSesion) {
    const guardada = await this.adminService.actualizarMatrizPermisos(cuerpo, actor);
    return { exito: true, datos: guardada };
  }

  @Get('auditoria')
  @RequirePermission('admin', 'ver')
  @ApiOperation({ summary: 'Consulta la bitácora general de auditoría en MongoDB Atlas' })
  async consultarAuditoria(
    @Query('pagina') paginaRaw?: string,
    @Query('limite') limiteRaw?: string,
    @Query('modulo') moduloRaw?: string,
    @Query('tipoEvento') tipoEventoRaw?: string,
    @Query('busqueda') busquedaRaw?: string
  ) {
    const resultado = await this.auditService.consultarAuditoria({
      pagina: Number(paginaRaw ?? '1'),
      limite: Number(limiteRaw ?? '10'),
      modulo: (moduloRaw ?? 'todos') as IdModulo | 'auth' | 'todos',
      tipoEvento: (tipoEventoRaw ?? 'todos') as TipoEventoAuditoria | 'todos',
      busqueda: busquedaRaw ?? '',
    });

    return {
      exito: true,
      datos: resultado.eventos,
      origen: resultado.origen,
      paginacion: {
        pagina: resultado.pagina,
        limite: resultado.limite,
        total: resultado.total,
        totalPaginas: resultado.totalPaginas,
      },
    };
  }

  @Post('auditoria')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registra un evento en la bitácora general (MongoDB Atlas)' })
  async registrarEvento(
    @Body()
    body: {
      modulo?: IdModulo | 'auth';
      tipoEvento?: TipoEventoAuditoria;
      entidad?: string;
      entidadId?: string;
      detalle?: string;
    },
    @CurrentUser() sesion: PayloadSesion
  ) {
    if (!body.modulo || !body.tipoEvento || !body.entidad || !body.detalle) {
      throw new BadRequestException(
        'modulo, tipoEvento, entidad y detalle son obligatorios.'
      );
    }

    const moduloValido: IdModulo | 'auth' =
      body.modulo === 'auth' || IDS_MODULOS.includes(body.modulo) ? body.modulo : 'almacen';
    const tipoValido: TipoEventoAuditoria = TIPOS_EVENTO_AUDITORIA.includes(body.tipoEvento)
      ? body.tipoEvento
      : 'creacion';

    const creado = await this.auditService.registrarEventoGeneral({
      usuarioId: sesion.sub,
      usuarioNombre: sesion.nombre,
      rol: sesion.rol,
      modulo: moduloValido,
      tipoEvento: tipoValido,
      entidad: body.entidad,
      entidadId: body.entidadId,
      detalle: body.detalle,
    });

    return { exito: true, datos: creado };
  }
}
