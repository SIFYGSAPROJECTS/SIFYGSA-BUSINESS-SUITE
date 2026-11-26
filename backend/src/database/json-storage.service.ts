import { Injectable, Logger } from '@nestjs/common';
import crypto from 'node:crypto';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

@Injectable()
export class JsonStorageService {
  private readonly logger = new Logger(JsonStorageService.name);
  private readonly bloqueosPorArchivo = new Map<string, Promise<unknown>>();
  private readonly almacenMemoria = new Map<string, unknown>();
  private readonly directorioSemilla: string;
  private directorioEscrituraActual: string;

  constructor() {
    // Compartir el directorio ../data con el repositorio raíz de SIFYGSA
    this.directorioSemilla = process.env.DATA_DIR
      ? path.resolve(process.env.DATA_DIR)
      : path.resolve(process.cwd(), '..', 'data');
    this.directorioEscrituraActual = this.directorioSemilla;
  }

  private async ejecutarConBloqueo<T>(
    clave: string,
    operacion: () => Promise<T>
  ): Promise<T> {
    const promesaPrevia = this.bloqueosPorArchivo.get(clave) ?? Promise.resolve();
    let resolverActual!: () => void;
    const promesaActual = new Promise<void>((resolve) => {
      resolverActual = resolve;
    });

    this.bloqueosPorArchivo.set(
      clave,
      promesaPrevia.then(() => promesaActual).catch(() => promesaActual)
    );

    await promesaPrevia.catch(() => undefined);

    try {
      return await operacion();
    } finally {
      resolverActual();
      if (this.bloqueosPorArchivo.get(clave) === promesaActual) {
        this.bloqueosPorArchivo.delete(clave);
      }
    }
  }

  private async escribirArchivoAtomico<T>(limpio: string, datos: T): Promise<void> {
    this.almacenMemoria.set(limpio, datos);

    const intentarGuardar = async (directorio: string): Promise<void> => {
      await fs.mkdir(directorio, { recursive: true });
      const sufijo = `${process.pid}.${Date.now()}.${crypto.randomBytes(4).toString('hex')}.tmp`;
      const rutaTmp = path.join(directorio, `${limpio}.${sufijo}`);
      const rutaFinal = path.join(directorio, limpio);
      await fs.writeFile(rutaTmp, JSON.stringify(datos, null, 2), { encoding: 'utf-8' });
      await fs.rename(rutaTmp, rutaFinal);
    };

    try {
      await intentarGuardar(this.directorioEscrituraActual);
    } catch (error) {
      const err = error as NodeJS.ErrnoException;
      if (
        (err.code === 'EROFS' || err.code === 'EACCES' || err.code === 'EPERM') &&
        this.directorioEscrituraActual !== path.join(os.tmpdir(), 'sifygsa_data')
      ) {
        this.directorioEscrituraActual = path.join(os.tmpdir(), 'sifygsa_data');
        await intentarGuardar(this.directorioEscrituraActual).catch(() => undefined);
        return;
      }
      this.logger.warn(`No se pudo persistir ${limpio} en disco: ${err.message}`);
    }
  }

  private async leerJsonInterno<T>(limpio: string, valorPorDefecto: T): Promise<T> {
    const rutaEscritura = path.join(this.directorioEscrituraActual, limpio);
    try {
      const contenido = await fs.readFile(rutaEscritura, 'utf-8');
      const datos = JSON.parse(contenido) as T;
      this.almacenMemoria.set(limpio, datos);
      return structuredClone(datos);
    } catch (errEscritura) {
      const err = errEscritura as NodeJS.ErrnoException;
      if (this.almacenMemoria.has(limpio)) {
        return structuredClone(this.almacenMemoria.get(limpio) as T);
      }
      if (err.code === 'ENOENT') {
        this.almacenMemoria.set(limpio, valorPorDefecto);
        this.escribirArchivoAtomico(limpio, valorPorDefecto).catch(() => undefined);
        return structuredClone(valorPorDefecto);
      }
      throw new Error(`Error al leer ${limpio}: ${err.message}`);
    }
  }

  async leerJson<T>(nombreArchivo: string, valorPorDefecto: T): Promise<T> {
    const limpio = path.basename(nombreArchivo);
    return this.ejecutarConBloqueo(limpio, () => this.leerJsonInterno<T>(limpio, valorPorDefecto));
  }

  async escribirJson<T>(nombreArchivo: string, datos: T): Promise<void> {
    const limpio = path.basename(nombreArchivo);
    return this.ejecutarConBloqueo(limpio, () => this.escribirArchivoAtomico<T>(limpio, datos));
  }

  async actualizarJson<T>(
    nombreArchivo: string,
    valorPorDefecto: T,
    transformador: (actual: T) => T | Promise<T>
  ): Promise<T> {
    const limpio = path.basename(nombreArchivo);
    return this.ejecutarConBloqueo(limpio, async () => {
      const actual = await this.leerJsonInterno<T>(limpio, valorPorDefecto);
      const actualizado = await transformador(actual);
      await this.escribirArchivoAtomico(limpio, actualizado);
      return actualizado;
    });
  }
}
