import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { formatearIsoMexico } from '../../common/utils/fecha-mx';
import { MongoService } from '../../database/mongo.service';
import { PostgresService } from '../../database/postgres.service';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly mongo: MongoService,
    private readonly postgres: PostgresService
  ) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Verifica estado del backend NestJS, MongoDB Atlas y PostgreSQL' })
  async check() {
    const [mongo, postgres] = await Promise.all([
      this.mongo.verificarSalud(),
      this.postgres.verificarSalud(),
    ]);

    return {
      exito: true,
      datos: {
        estado: 'operativo',
        framework: 'NestJS',
        version: '4.0.0',
        timestamp: formatearIsoMexico(),
        basesDatos: {
          mongodb: mongo,
          postgresql: postgres,
        },
      },
    };
  }
}
