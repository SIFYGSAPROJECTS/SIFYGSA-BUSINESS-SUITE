import { promises as fs } from 'fs';
import path from 'path';
import crypto from 'crypto';

/**
 * Cola de promesas por archivo para serializar lecturas/escrituras
 * y evitar condiciones de carrera o corrupción de JSON en el servidor.
 */
const bloqueosPorArchivo = new Map<string, Promise<unknown>>();

function obtenerRutaDatos(nombreArchivo: string): string {
  const limpio = path.basename(nombreArchivo);
  return path.join(process.cwd(), 'data', limpio);
}

async function ejecutarConBloqueo<T>(rutaArchivo: string, operacion: () => Promise<T>): Promise<T> {
  const promesaPrevia = bloqueosPorArchivo.get(rutaArchivo) ?? Promise.resolve();

  let resolverActual!: () => void;
  const promesaActual = new Promise<void>((resolve) => {
    resolverActual = resolve;
  });

  bloqueosPorArchivo.set(
    rutaArchivo,
    promesaPrevia.then(() => promesaActual).catch(() => promesaActual)
  );

  await promesaPrevia.catch(() => undefined);

  try {
    return await operacion();
  } finally {
    resolverActual();
    if (bloqueosPorArchivo.get(rutaArchivo) === promesaActual) {
      bloqueosPorArchivo.delete(rutaArchivo);
    }
  }
}

async function asegurarDirectorioDatos(): Promise<void> {
  const dir = path.join(process.cwd(), 'data');
  await fs.mkdir(dir, { recursive: true });
}

/**
 * Lee un archivo JSON desde `data/` de manera segura.
 * Si el archivo no existe, inicializa con `valorPorDefecto` de forma atómica.
 */
export async function leerJsonSeguro<T>(nombreArchivo: string, valorPorDefecto: T): Promise<T> {
  const rutaArchivo = obtenerRutaDatos(nombreArchivo);

  return ejecutarConBloqueo(rutaArchivo, async () => {
    try {
      const contenido = await fs.readFile(rutaArchivo, 'utf-8');
      return JSON.parse(contenido) as T;
    } catch (error) {
      const err = error as NodeJS.ErrnoException;
      if (err.code === 'ENOENT') {
        await asegurarDirectorioDatos();
        await escribirArchivoAtomico(rutaArchivo, valorPorDefecto);
        return valorPorDefecto;
      }
      throw new Error(`Error al leer ${nombreArchivo}: ${err.message}`);
    }
  });
}

async function escribirArchivoAtomico<T>(rutaArchivo: string, datos: T): Promise<void> {
  await asegurarDirectorioDatos();
  const sufijoTemporal = `${process.pid}.${Date.now()}.${crypto.randomBytes(4).toString('hex')}.tmp`;
  const rutaTemporal = `${rutaArchivo}.${sufijoTemporal}`;
  const serializado = JSON.stringify(datos, null, 2);

  await fs.writeFile(rutaTemporal, serializado, { encoding: 'utf-8' });
  await fs.rename(rutaTemporal, rutaArchivo);
}

/**
 * Escribe un archivo JSON en `data/` de forma atómica (archivo temporal + rename)
 * serializando escrituras concurrentes mediante bloqueo en memoria.
 */
export async function escribirJsonSeguro<T>(nombreArchivo: string, datos: T): Promise<void> {
  const rutaArchivo = obtenerRutaDatos(nombreArchivo);

  return ejecutarConBloqueo(rutaArchivo, async () => {
    await escribirArchivoAtomico(rutaArchivo, datos);
  });
}

/**
 * Actualiza un archivo JSON de forma transaccional (lectura + transformación + escritura atómica)
 * dentro de un mismo bloqueo exclusivo.
 */
export async function actualizarJsonSeguro<T>(
  nombreArchivo: string,
  valorPorDefecto: T,
  transformador: (actual: T) => T | Promise<T>
): Promise<T> {
  const rutaArchivo = obtenerRutaDatos(nombreArchivo);

  return ejecutarConBloqueo(rutaArchivo, async () => {
    let actual: T;
    try {
      const contenido = await fs.readFile(rutaArchivo, 'utf-8');
      actual = JSON.parse(contenido) as T;
    } catch (error) {
      const err = error as NodeJS.ErrnoException;
      if (err.code === 'ENOENT') {
        actual = valorPorDefecto;
      } else {
        throw error;
      }
    }

    const actualizado = await transformador(actual);
    await escribirArchivoAtomico(rutaArchivo, actualizado);
    return actualizado;
  });
}
