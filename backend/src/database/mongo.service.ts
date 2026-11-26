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
  private conectarPromesa: Promise<MongoClient> | null = null;
  private coleccionesAseguradas = false;
  private ultimoError: string | null = null;

  get uri(): string {
    return (process.env.MONGODB_URI || '').trim();
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
        !u.includes('<usuario>') &&
        !u.includes('<password>') &&
        !u.includes('TU_PASSWORD') &&
        !u.includes('.xxxxx.')
    );
  }

  async onModuleInit(): Promise<void> {
    if (!this.estaConfigurado()) {
      this.ultimoError =
        'Falta configurar MONGODB_URI real en .env.local (raíz del proyecto o backend/).';
      this.logger.warn(
        'MONGODB_URI no configurada con credenciales reales; bitácoras y auditoría usarán respaldo local JSON (data/auditoria.json y data/bitacora-crm-promesas.json) hasta configurar Atlas.'
      );
      return;
    }

    try {
      await this.conectar();
      this.logger.log(`MongoDB Atlas conectado (BD Bitácoras: ${this.nombreBdBitacoras})`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.ultimoError = msg;
      this.logger.warn(
        `No se pudo conectar inicialmente a MongoDB Atlas (verifica red/IP Access List en Atlas y contraseña): ${msg}`
      );
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (this.client) {
      await this.client.close().catch(() => undefined);
      this.client = null;
      this.conectado = false;
      this.conectarPromesa = null;
      this.coleccionesAseguradas = false;
    }
  }

  private async asegurarColeccionesBitacoras(db: Db): Promise<void> {
    if (this.coleccionesAseguradas) return;
    try {
      const existentes = await db.listCollections({}, { nameOnly: true }).toArray();
      const nombres = new Set(existentes.map((c) => c.name));

      if (!nombres.has(COLECCION_BITACORA_GENERAL)) {
        await db.createCollection(COLECCION_BITACORA_GENERAL, {
          validator: VALIDADOR_BITACORA_GENERAL,
          validationLevel: 'strict',
          validationAction: 'error',
        });
      } else {
        await db
          .command({
            collMod: COLECCION_BITACORA_GENERAL,
            validator: VALIDADOR_BITACORA_GENERAL,
            validationLevel: 'strict',
            validationAction: 'error',
          })
          .catch(() => undefined);
      }

      await db.collection(COLECCION_BITACORA_GENERAL).createIndexes([
        { key: { fecha: -1 }, name: 'idx_fecha_desc' },
        { key: { modulo: 1, fecha: -1 }, name: 'idx_modulo_fecha' },
        { key: { tipoEvento: 1, fecha: -1 }, name: 'idx_tipoEvento_fecha' },
        { key: { usuarioId: 1, fecha: -1 }, name: 'idx_usuarioId_fecha' },
        { key: { id: 1 }, name: 'idx_id_unico', unique: true },
      ]);

      if (!nombres.has(COLECCION_BITACORA_CRM_PROMESAS)) {
        await db.createCollection(COLECCION_BITACORA_CRM_PROMESAS, {
          validator: VALIDADOR_BITACORA_CRM_PROMESAS,
          validationLevel: 'strict',
          validationAction: 'error',
        });
      } else {
        await db
          .command({
            collMod: COLECCION_BITACORA_CRM_PROMESAS,
            validator: VALIDADOR_BITACORA_CRM_PROMESAS,
            validationLevel: 'strict',
            validationAction: 'error',
          })
          .catch(() => undefined);
      }

      await db.collection(COLECCION_BITACORA_CRM_PROMESAS).createIndexes([
        { key: { folio: 1, fecha: -1 }, name: 'idx_folio_fecha_desc' },
        { key: { folio: 1, tipo: 1, fecha: -1 }, name: 'idx_folio_tipo_fecha' },
        { key: { usuarioId: 1, fecha: -1 }, name: 'idx_promesa_usuario_fecha' },
        { key: { id: 1 }, name: 'idx_promesa_id_unico', unique: true },
      ]);

      this.coleccionesAseguradas = true;
    } catch (err) {
      // No impedir operación si el usuario de Atlas tiene solo permisos de lectura/escritura
      this.logger.warn(
        `Aviso al asegurar índices/esquemas en MongoDB Atlas: ${err instanceof Error ? err.message : String(err)}`
      );
      this.coleccionesAseguradas = true;
    }
  }

  private async conectar(): Promise<MongoClient> {
    if (this.client && this.conectado) {
      return this.client;
    }
    if (this.conectarPromesa) {
      return this.conectarPromesa;
    }

    this.conectarPromesa = (async () => {
      const nuevoCliente = new MongoClient(this.uri, {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 10000,
        connectTimeoutMS: 10000,
      });
      try {
        await nuevoCliente.connect();
        this.client = nuevoCliente;
        this.conectado = true;
        this.ultimoError = null;
        await this.asegurarColeccionesBitacoras(nuevoCliente.db(this.nombreBdBitacoras));
        return nuevoCliente;
      } catch (err) {
        this.conectado = false;
        this.client = null;
        this.ultimoError = err instanceof Error ? err.message : String(err);
        await nuevoCliente.close().catch(() => undefined);
        throw err;
      } finally {
        this.conectarPromesa = null;
      }
    })();

    return this.conectarPromesa;
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
    detalle?: string;
  }> {
    if (!this.estaConfigurado()) {
      return {
        estado: 'pendiente_configuracion',
        baseDatosBitacoras: this.nombreBdBitacoras,
        baseDatosImagenes: this.nombreBdImagenes,
        detalle:
          'Define MONGODB_URI real en .env.local para escribir en MongoDB Atlas en lugar del respaldo JSON.',
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
    } catch (err) {
      const detalle = err instanceof Error ? err.message : String(err);
      this.ultimoError = detalle;
      return {
        estado: 'desconectado',
        baseDatosBitacoras: this.nombreBdBitacoras,
        baseDatosImagenes: this.nombreBdImagenes,
        detalle,
      };
    }
  }
}
