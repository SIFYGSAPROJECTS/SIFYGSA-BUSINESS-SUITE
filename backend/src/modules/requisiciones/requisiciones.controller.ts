import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Put,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import type { PayloadSesion } from '../../common/types/erp.types';
import { RequisicionesService } from './requisiciones.service';

@ApiTags('Requisiciones')
@Controller('requisiciones')
export class RequisicionesController {
  constructor(private readonly requisicionesService: RequisicionesService) {}

  @Get()
  @ApiOperation({ summary: 'Lista requisiciones según el alcance RBAC del usuario' })
  async listar(@CurrentUser() actor: PayloadSesion) {
    const requisiciones = await this.requisicionesService.listarParaUsuario(actor);
    return { exito: true, datos: requisiciones };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission('requisiciones', 'crear')
  @ApiOperation({ summary: 'Crea una nueva requisición con validaciones de presupuesto y flujo' })
  async crear(@Body() cuerpo: unknown, @CurrentUser() actor: PayloadSesion) {
    const creada = await this.requisicionesService.crear(cuerpo, actor);
    return { exito: true, datos: creada };
  }

  @Put(':id')
  @ApiOperation({ summary: 'Actualiza una requisición registrando cambios campo a campo' })
  async actualizar(
    @Param('id') id: string,
    @Body() cuerpo: unknown,
    @CurrentUser() actor: PayloadSesion
  ) {
    const actualizada = await this.requisicionesService.actualizarConBitacora(id, cuerpo, actor);
    return { exito: true, datos: actualizada };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Avanza, aprueba, rechaza o cancela el estado de una requisición' })
  async transicion(
    @Param('id') id: string,
    @Body() cuerpo: unknown,
    @CurrentUser() actor: PayloadSesion
  ) {
    const actualizada = await this.requisicionesService.avanzarEstado(id, cuerpo, actor);
    return { exito: true, datos: actualizada };
  }
}
