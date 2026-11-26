import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  UnprocessableEntityException,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { ComprasService } from './compras.service';

@ApiTags('Compras & Facturación CFDI')
@Controller('compras')
export class ComprasController {
  constructor(private readonly comprasService: ComprasService) {}

  @Get()
  @RequirePermission('compras', 'ver')
  @ApiOperation({ summary: 'Resumen ejecutivo del módulo de Compras & Procura' })
  obtenerResumen() {
    const datos = this.comprasService.obtenerMetricasDashboard();
    return {
      exito: true,
      modulo: 'Compras & Procura',
      version: '2026.4',
      datos,
    };
  }

  @Get('dashboard')
  @RequirePermission('compras', 'ver')
  @ApiOperation({ summary: 'Obtiene KPIs y gráficas de Órdenes de Compra' })
  obtenerDashboard() {
    const datos = this.comprasService.obtenerMetricasDashboard();
    return { exito: true, datos };
  }

  @Post('facturas/extraer-xml')
  @RequirePermission('compras', 'ver')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Extrae metadatos fiscales de un XML CFDI 4.0 (multipart o JSON)' })
  extraerXml(
    @UploadedFile() file?: Express.Multer.File,
    @Body() body?: { xml?: string }
  ) {
    const xmlText = file ? file.buffer.toString('utf-8') : body?.xml || '';
    if (!xmlText.trim()) {
      throw new BadRequestException('Contenido XML vacío o no válido.');
    }

    try {
      const resultado = this.comprasService.extraerDatosXmlCfdi(xmlText);
      return { success: true, exito: true, data: resultado, datos: resultado };
    } catch (err) {
      const mensaje =
        err instanceof Error ? err.message : 'Error desconocido al procesar XML CFDI 4.0';
      throw new UnprocessableEntityException({ success: false, exito: false, error: mensaje });
    }
  }
}
