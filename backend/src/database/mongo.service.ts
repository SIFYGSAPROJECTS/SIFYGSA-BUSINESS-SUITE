import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { MongoClient, type Db, type Document } from 'mongodb';

export const COLECCION_BITACORA_GENERAL = 'bitacora_general';
export const COLECCION_BITACORA_CRM_PROMESAS = 'bitacora_crm_promesas';

export const VALIDADOR_BITACORA_GENERAL: Document = {
  $jsonSchema: {
    bsonType: 'object',
    required: [
      'id',
      'fecha',
      'usuarioId',
      'usuarioNombre',
      'rol',
      'modulo',
      'tipoEvento',
      'entidad',
      'detalle',
    ],
    properties: {
      id: { bsonType: 'string' },
      fecha: { bsonType: 'string' },
      fechaLegible: { bsonType: 'string' },
      usuarioId: { bsonType: 'string' },
      usuarioNombre: { bsonType: 'string' },
      rol: {
        bsonType: 'string',
        enum: ['administrador', 'gerente', 'vendedor', 'rrhh', 'requisiciones'],
      },
      modulo: {
        bsonType: 'string',
        enum: ['auth', 'admin', 'crm', 'requisiciones', 'compras', 'rrhh', 'almacen', 'autorizacion-ordenes'],
      },
      tipoEvento: {
        bsonType: 'string',
        enum: [
          'inicio_sesion',
          'cierre_sesion',
          'intento_fallido',
          'creacion',
          'actualizacion',
          'eliminacion',
          'aprobacion',
          'rechazo',
          'exportacion',
          'cambio_permisos',
        ],
      },
      entidad: { bsonType: 'string' },
      entidadId: { bsonType: 'string' },
      detalle: { bsonType: 'string' },
      ip: { bsonType: 'string' },
    },
  },
};

export const VALIDADOR_BITACORA_CRM_PROMESAS: Document = {
  $jsonSchema: {
    bsonType: 'object',
    required: ['id', 'folio', 'fecha', 'horaEtiqueta', 'autor', 'iniciales', 'tipo', 'texto'],
    properties: {
      id: { bsonType: 'string' },
      folio: { bsonType: 'string' },
      nombrePromesa: { bsonType: 'string' },
      clientePromesa: { bsonType: 'string' },
      fecha: { bsonType: 'string' },
      fechaLegible: { bsonType: 'string' },
      horaEtiqueta: { bsonType: 'string' },
      usuarioId: { bsonType: 'string' },
      autor: { bsonType: 'string' },
      iniciales: { bsonType: 'string' },
      rolEtiqueta: { bsonType: 'string' },
      tipo: {
        bsonType: 'string',
        enum: ['movement', 'modification', 'note', 'message', 'activity', 'system'],
      },
      titulo: { bsonType: 'string' },
      campoEtiqueta: { bsonType: 'string' },
      valorAnterior: { bsonType: 'string' },
      valorNuevo: { bsonType: 'string' },
      texto: { bsonType: 'string' },
      esBot: { bsonType: 'bool' },
    },
  },
};

@Injectable()
export class MongoService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MongoService.name);
  private client: MongoClient | null = null;
  private conectado = false;

  get uri(): string {
    const candidatos = [
      process.env.DOCKER_MONGODB_URI,
      process.env.MONGODB_URI,
      process.env.DOCKER_FALLBACK_MONGODB_URI,
    ];
    for (const raw of candidatos) {
      const u = (raw || '').trim();
      if (
        u &&
        (u.startsWith('mongodb://') || u.startsWith('mongodb+srv://')) &&
        !u.includes('<password>') &&
        !u.includes('TU_PASSWORD')
      ) {
        return u;
      }
    }
    return '';
  }

  get nombreBdBitacoras(): string {
    return (process.env.MONGODB_BITACORAS_DB || 'BitacoraSifigsa').trim();
  }

  get nombreBdImagenes(): string {
    return (process.env.MONGODB_IMAGENES_DB || 'ImagenesSifigsa').trim();
  }

  estaConfigurado(): boolean {
    const u = this.uri;
    return Boolean(
      u &&
        (u.startsWith('mongodb://') || u.startsWith('mongodb+srv://')) &&
        !u.includes('<password>') &&
        !u.includes('TU_PASSWORD')
    );
  }

  async onModuleInit(): Promise<void> {
    if (!this.estaConfigurado()) {
      this.logger.warn(
        'MONGODB_URI no configurada; la auditoría utilizará respaldo local JSON hasta configurarla.'
      );
      return;
    }

    try {
      await this.conectar();
      this.logger.log(`MongoDB Atlas conectado (BD Bitácoras: ${this.nombreBdBitacoras})`);
    } catch (err) {
      this.logger.warn(
        `No se pudo conectar inicialmente a MongoDB Atlas: ${err instanceof Error ? err.message : String(err)}`
      );
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (this.client) {
      await this.client.close();
      this.client = null;
      this.conectado = false;
    }
  }

  private async conectar(): Promise<MongoClient> {
    if (this.client && this.conectado) {
      return this.client;
    }
    this.client = new MongoClient(this.uri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 6000,
    });
    await this.client.connect();
    this.conectado = true;
    return this.client;
  }

  async obtenerBdBitacoras(): Promise<Db> {
    const client = await this.conectar();
    return client.db(this.nombreBdBitacoras);
  }

  async obtenerBdImagenes(): Promise<Db> {
    const client = await this.conectar();
    return client.db(this.nombreBdImagenes);
  }

  async verificarSalud(): Promise<{
    estado: 'conectado' | 'desconectado' | 'pendiente_configuracion';
    baseDatosBitacoras: string;
    baseDatosImagenes: string;
  }> {
    if (!this.estaConfigurado()) {
      return {
        estado: 'pendiente_configuracion',
        baseDatosBitacoras: this.nombreBdBitacoras,
        baseDatosImagenes: this.nombreBdImagenes,
      };
    }

    try {
      const db = await this.obtenerBdBitacoras();
      await db.command({ ping: 1 });
      return {
        estado: 'conectado',
        baseDatosBitacoras: this.nombreBdBitacoras,
        baseDatosImagenes: this.nombreBdImagenes,
      };
    } catch {
      return {
        estado: 'desconectado',
        baseDatosBitacoras: this.nombreBdBitacoras,
        baseDatosImagenes: this.nombreBdImagenes,
      };
    }
  }
}
