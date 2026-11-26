import { promises as fs } from 'fs';
import path from 'path';
import crypto from 'crypto';
import os from 'os';

/**
 * Cola de promesas por clave/archivo para serializar lecturas/escrituras
 * y evitar condiciones de carrera o corrupción de datos.
 */
const bloqueosPorArchivo = new Map<string, Promise<unknown>>();

/**
 * Directorio de origen (datos empaquetados en el repositorio).
 */
const DIRECTORIO_SEMILLA = path.join(process.cwd(), 'data');

/**
 * Determina el directorio de escritura inicial.
 * En Vercel / AWS Lambda (/var/task es de solo lectura), se utiliza os.tmpdir() (/tmp).
 * En entornos locales o con filesystem de lectura/escritura, se utiliza process.cwd()/data.
 */
function calcularDirectorioEscrituraInicial(): string {
  if (process.env.DATA_DIR) {
    return path.resolve(process.env.DATA_DIR);
  }
  const esServerless = Boolean(
    process.env.VERCEL ||
    process.env.AWS_LAMBDA_FUNCTION_NAME ||
    process.env.LAMBDA_TASK_ROOT
  );
  if (esServerless) {
    return path.join(os.tmpdir(), 'sifygsa_data');
  }
  return DIRECTORIO_SEMILLA;
}

let directorioEscrituraActual = calcularDirectorioEscrituraInicial();

function cambiarADirectorioTemporal(): string {
  const dirTmp = path.join(os.tmpdir(), 'sifygsa_data');
  directorioEscrituraActual = dirTmp;
  return dirTmp;
}

/**
 * Cache en memoria de alta velocidad y fallback de resiliencia.
 */
const almacenMemoria = new Map<string, unknown>();

/**
 * Ejecuta una operación atómica serializada por clave.
 */
async function ejecutarConBloqueo<T>(clave: string, operacion: () => Promise<T>): Promise<T> {
  const promesaPrevia = bloqueosPorArchivo.get(clave) ?? Promise.resolve();

  let resolverActual!: () => void;
  const promesaActual = new Promise<void>((resolve) => {
    resolverActual = resolve;
  });

  bloqueosPorArchivo.set(
    clave,
    promesaPrevia.then(() => promesaActual).catch(() => promesaActual)
  );

  await promesaPrevia.catch(() => undefined);

  try {
    return await operacion();
  } finally {
    resolverActual();
    if (bloqueosPorArchivo.get(clave) === promesaActual) {
      bloqueosPorArchivo.delete(clave);
    }
  }
}

/**
 * Escribe un archivo atómicamente asegurando soporte para entornos de solo lectura (Vercel).
 * NOTA: Esta función interna NO adquiere bloqueo por sí misma para permitir ser llamada
 * dentro de operaciones ya bloqueadas sin generar deadlocks.
 */
async function escribirArchivoAtomico<T>(limpio: string, datos: T): Promise<void> {
  almacenMemoria.set(limpio, datos);

  async function intentarGuardar(directorio: string): Promise<void> {
    await fs.mkdir(directorio, { recursive: true });
    const sufijoTemporal = `${process.pid}.${Date.now()}.${crypto.randomBytes(4).toString('hex')}.tmp`;
    const rutaTemporal = path.join(/*turbopackIgnore: true*/ directorio, `${limpio}.${sufijoTemporal}`);
    const rutaFinal = path.join(/*turbopackIgnore: true*/ directorio, limpio);
    const serializado = JSON.stringify(datos, null, 2);

    await fs.writeFile(/*turbopackIgnore: true*/ rutaTemporal, serializado, { encoding: 'utf-8' });
    await fs.rename(/*turbopackIgnore: true*/ rutaTemporal, rutaFinal);
  }

  try {
    await intentarGuardar(directorioEscrituraActual);
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    // Si el directorio no permite escritura (EROFS, EACCES, EPERM), migrar dinámicamente a /tmp
    if (
      (err.code === 'EROFS' || err.code === 'EACCES' || err.code === 'EPERM') &&
      directorioEscrituraActual !== path.join(os.tmpdir(), 'sifygsa_data')
    ) {
      console.warn(
        `[json-storage] Directorio ${directorioEscrituraActual} es de solo lectura (${err.code}). Migrando a /tmp.`
      );
      const dirTmp = cambiarADirectorioTemporal();
      try {
        await intentarGuardar(dirTmp);
        return;
      } catch (subErr) {
        console.warn(`[json-storage] Advertencia al escribir en /tmp:`, subErr);
        return;
      }
    }

    console.warn(`[json-storage] No se pudo persistir ${limpio} en disco (${err.message}). Datos retenidos en memoria.`);
  }
}

/**
 * Lee un archivo JSON desde el almacenamiento seguro (sin adquirir bloqueo).
 */
async function leerJsonInterno<T>(limpio: string, valorPorDefecto: T): Promise<T> {
  if (almacenMemoria.has(limpio)) {
    return structuredClone(almacenMemoria.get(limpio) as T);
  }

  // 1. Intentar leer del directorio de escritura (ej. /tmp en Vercel o data/ en local)
  const rutaEscritura = path.join(/*turbopackIgnore: true*/ directorioEscrituraActual, limpio);
  try {
    const contenido = await fs.readFile(/*turbopackIgnore: true*/ rutaEscritura, 'utf-8');
    const datos = JSON.parse(contenido) as T;
    almacenMemoria.set(limpio, datos);
    return structuredClone(datos);
  } catch (errEscritura) {
    const err = errEscritura as NodeJS.ErrnoException;

    // 2. Si no existe en escritura y estamos en Vercel (/tmp), buscar en el directorio semilla
    if (err.code === 'ENOENT' && directorioEscrituraActual !== DIRECTORIO_SEMILLA) {
      const rutaSemilla = path.join(DIRECTORIO_SEMILLA, limpio);
      try {
        const contenidoSemilla = await fs.readFile(rutaSemilla, 'utf-8');
        const datosSemilla = JSON.parse(contenidoSemilla) as T;
        almacenMemoria.set(limpio, datosSemilla);
        // Sembrar en /tmp en segundo plano
        escribirArchivoAtomico(limpio, datosSemilla).catch(() => undefined);
        return structuredClone(datosSemilla);
      } catch (errSemilla) {
        const errS = errSemilla as NodeJS.ErrnoException;
        if (errS.code === 'ENOENT') {
          almacenMemoria.set(limpio, valorPorDefecto);
          return structuredClone(valorPorDefecto);
        }
        throw new Error(`Error al leer archivo semilla ${limpio}: ${errS.message}`);
      }
    }

    if (err.code === 'ENOENT') {
      almacenMemoria.set(limpio, valorPorDefecto);
      escribirArchivoAtomico(limpio, valorPorDefecto).catch(() => undefined);
      return structuredClone(valorPorDefecto);
    }

    throw new Error(`Error al leer ${limpio}: ${err.message}`);
  }
}

/**
 * Lee un archivo JSON desde el almacenamiento seguro.
 * Prioriza memoria -> directorio de escritura (/tmp o data/) -> directorio semilla (data/).
 * Si el archivo no existe, inicializa con `valorPorDefecto`.
 */
export async function leerJsonSeguro<T>(nombreArchivo: string, valorPorDefecto: T): Promise<T> {
  const limpio = path.basename(nombreArchivo);
  return ejecutarConBloqueo(limpio, () => leerJsonInterno<T>(limpio, valorPorDefecto));
}

/**
 * Escribe un archivo JSON de forma segura y atómica.
 */
export async function escribirJsonSeguro<T>(nombreArchivo: string, datos: T): Promise<void> {
  const limpio = path.basename(nombreArchivo);
  return ejecutarConBloqueo(limpio, () => escribirArchivoAtomico<T>(limpio, datos));
}

/**
 * Actualiza un archivo JSON de forma transaccional (lectura + transformación + escritura)
 * garantizando persistencia atómica, tolerancia a entornos de solo lectura y libre de interbloqueos (deadlocks).
 */
export async function actualizarJsonSeguro<T>(
  nombreArchivo: string,
  valorPorDefecto: T,
  transformador: (actual: T) => T | Promise<T>
): Promise<T> {
  const limpio = path.basename(nombreArchivo);

  return ejecutarConBloqueo(limpio, async () => {
    const actual = await leerJsonInterno<T>(limpio, valorPorDefecto);
    const actualizado = await transformador(actual);
    await escribirArchivoAtomico(limpio, actualizado);
    return actualizado;
  });
}
