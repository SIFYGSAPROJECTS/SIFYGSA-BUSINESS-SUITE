import { Body, Controller, Get, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import type { PayloadSesion } from '../../common/types/erp.types';
import {
  AlmacenService,
  type EntradaArticuloAlmacen,
  type EntradaMovimientoAlmacen,
} from './almacen.service';

@ApiTags('Almacén & SGA')
@Controller('almacen')
export class AlmacenController {
  constructor(private readonly almacenService: AlmacenService) {}

  @Get()
  @RequirePermission('almacen', 'ver')
  @ApiOperation({ summary: 'Resumen de almacenes, total de artículos y movimientos' })
  async obtenerResumen() {
    const datos = await this.almacenService.obtenerDatos();
    return {
      exito: true,
      datos: {
        totalArticulos: datos.articulos.length,
        totalMovimientos: datos.movimientos.length,
        almacenes: datos.almacenes,
        version: '1.0.0',
      },
    };
  }

  @Get('articulos')
  @RequirePermission('almacen', 'ver')
  @ApiOperation({ summary: 'Lista el catálogo maestro de artículos de almacén' })
  async listarArticulos() {
    const articulos = await this.almacenService.listarArticulos();
    return { exito: true, datos: articulos };
  }

  @Post('articulos')
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission('almacen', 'crear')
  @ApiOperation({ summary: 'Da de alta un nuevo artículo y lo registra en MongoDB bitacora_general' })
  async crearArticulo(
    @Body() cuerpo: EntradaArticuloAlmacen,
    @CurrentUser() actor: PayloadSesion
  ) {
    const creado = await this.almacenService.registrarArticulo(cuerpo, actor);
    return { exito: true, datos: creado };
  }

  @Get('movimientos')
  @RequirePermission('almacen', 'ver')
  @ApiOperation({ summary: 'Lista los movimientos de Kárdex de almacén' })
  async listarMovimientos() {
    const movimientos = await this.almacenService.listarMovimientos();
    return { exito: true, datos: movimientos };
  }

  @Post('movimientos')
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission('almacen', 'crear')
  @ApiOperation({ summary: 'Registra una entrada IR03 o salida de almacén y actualiza existencias' })
  async crearMovimiento(
    @Body() cuerpo: EntradaMovimientoAlmacen,
    @CurrentUser() actor: PayloadSesion
  ) {
    const creado = await this.almacenService.registrarMovimiento(cuerpo, actor);
    return { exito: true, datos: creado };
  }
}
