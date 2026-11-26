import fs from 'node:fs';
import path from 'node:path';
import { MongoClient, type Db } from 'mongodb';

function leerVariableEnvLocal(nombre: string): string {
  const desdeProceso = process.env[nombre]?.trim();
  if (desdeProceso) return desdeProceso;

  for (const archivo of ['.env.local', '.env']) {
    try {
      const rutaEnv = path.resolve(/*turbopackIgnore: true*/ process.cwd(), archivo);
      if (!fs.existsSync(rutaEnv)) continue;
      const contenido = fs.readFileSync(rutaEnv, 'utf-8');
      for (const linea of contenido.split(/\r?\n/)) {
        const limpia = linea.trim();
        if (!limpia || limpia.startsWith('#')) continue;
        const idx = limpia.indexOf('=');
        if (idx === -1) continue;
        const clave = limpia.slice(0, idx).trim();
        if (clave !== nombre) continue;
        let valor = limpia.slice(idx + 1).trim();
        if (
          (valor.startsWith('"') && valor.endsWith('"')) ||
          (valor.startsWith("'") && valor.endsWith("'"))
        ) {
          valor = valor.slice(1, -1);
        }
        if (valor.trim()) return valor.trim();
      }
    } catch {
      // ignorar si no se puede leer .env.local o .env
    }
  }
  return '';
}

export function obtenerUriMongo(): string {
  return leerVariableEnvLocal('MONGODB_URI');
}

export function obtenerNombreBdBitacoras(): string {
  return leerVariableEnvLocal('MONGODB_BITACORAS_DB') || 'BitacoraSifigsa';
}

export function obtenerNombreBdImagenes(): string {
  return leerVariableEnvLocal('MONGODB_IMAGENES_DB') || 'ImagenesSifigsa';
}

declare global {
  var _mongoClientPromiseSifygsa: Promise<MongoClient> | undefined;
}

export function estaMongoConfigurado(): boolean {
  const uri = obtenerUriMongo();
  return Boolean(
    uri &&
      (uri.startsWith('mongodb://') || uri.startsWith('mongodb+srv://')) &&
      !uri.includes('<password>') &&
      !uri.includes('TU_PASSWORD')
  );
}

export async function obtenerClienteMongo(): Promise<MongoClient> {
  const uri = obtenerUriMongo();
  if (!estaMongoConfigurado()) {
    throw new Error(
      'MONGODB_URI no está configurada o contiene valores de ejemplo en .env.local'
    );
  }

  if (process.env.NODE_ENV === 'development') {
    if (!globalThis._mongoClientPromiseSifygsa) {
      const client = new MongoClient(uri, {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 6000,
      });
      globalThis._mongoClientPromiseSifygsa = client.connect();
    }
    return globalThis._mongoClientPromiseSifygsa;
  }

  const client = new MongoClient(uri, {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 6000,
  });
  return client.connect();
}

export async function obtenerBdBitacoras(): Promise<Db> {
  const client = await obtenerClienteMongo();
  return client.db(obtenerNombreBdBitacoras());
}

export async function obtenerBdImagenes(): Promise<Db> {
  const client = await obtenerClienteMongo();
  return client.db(obtenerNombreBdImagenes());
}
