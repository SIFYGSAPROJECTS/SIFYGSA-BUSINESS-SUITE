import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('SifygsaNestBackend');
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    })
  );
  app.use(cookieParser());

  const frontendOrigins = (
    process.env.CORS_ORIGINS || 'http://localhost:3000,http://127.0.0.1:3000'
  )
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.enableCors({
    origin: frontendOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
  });

  app.setGlobalPrefix('api');

  // Documentación interactiva Swagger / OpenAPI en /api/docs
  const swaggerConfig = new DocumentBuilder()
    .setTitle('SIFYGSA Business Suite API (NestJS)')
    .setDescription(
      'Backend modular empresarial para SIFYGSA ERP: Autenticación JWT, RBAC, Administración, CRM, Requisiciones, Compras, Almacén, RRHH, Bitácoras en MongoDB Atlas y capa preparada para PostgreSQL.'
    )
    .setVersion('4.0.0')
    .addCookieAuth('sfg_erp_session')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  const port = Number(process.env.BACKEND_PORT || process.env.PORT || 4000);
  await app.listen(port);

  logger.log(`Backend NestJS operativo en http://localhost:${port}/api`);
  logger.log(`Documentación Swagger disponible en http://localhost:${port}/api/docs`);
}

void bootstrap();
