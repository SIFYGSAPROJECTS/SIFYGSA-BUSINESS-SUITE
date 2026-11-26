import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Pool, type QueryResult, type QueryResultRow } from 'pg';

/**
 * Servicio empresarial de PostgreSQL (pg.Pool) preparado para la migración
 * de Trabajadores, Compras, Facturación, Almacén y CRM relacional.
 * Cuando DATABASE_URL se configura en .env.local, se conecta automáticamente.
 */
@Injectable()
export class PostgresService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PostgresService.name);
  private pool: Pool | null = null;

  get databaseUrl(): string {
    return (process.env.DATABASE_URL || '').trim();
  }

  estaConfigurado(): boolean {
    const url = this.databaseUrl;
    return Boolean(
      url &&
        (url.startsWith('postgres://') || url.startsWith('postgresql://')) &&
        !url.includes('<password>')
    );
  }

  async onModuleInit(): Promise<void> {
    if (!this.estaConfigurado()) {
      this.logger.log(
        'PostgreSQL listo para conectar (agrega DATABASE_URL en .env.local para activar el pool PG).'
      );
      return;
    }

    this.pool = new Pool({
      connectionString: this.databaseUrl,
      max: Number(process.env.PG_POOL_MAX || 10),
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });

    try {
      await this.pool.query('SELECT 1');
      this.logger.log('Pool PostgreSQL conectado correctamente.');
    } catch (err) {
      this.logger.warn(
        `No se pudo verificar PostgreSQL al arrancar: ${err instanceof Error ? err.message : String(err)}`
      );
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
    }
  }

  async query<T extends QueryResultRow = QueryResultRow>(
    sql: string,
    params: unknown[] = []
  ): Promise<QueryResult<T>> {
    if (!this.pool) {
      throw new Error('PostgreSQL no está configurado. Define DATABASE_URL en .env.local.');
    }
    return this.pool.query<T>(sql, params);
  }

  async verificarSalud(): Promise<{
    estado: 'conectado' | 'desconectado' | 'pendiente_configuracion';
  }> {
    if (!this.estaConfigurado() || !this.pool) {
      return { estado: 'pendiente_configuracion' };
    }
    try {
      await this.pool.query('SELECT 1');
      return { estado: 'conectado' };
    } catch {
      return { estado: 'desconectado' };
    }
  }
}
