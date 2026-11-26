import { Injectable } from '@nestjs/common';

const MAX_INTENTOS_FALLIDOS = 5;
const DURACION_BLOQUEO_MS = 5 * 60 * 1000;

interface RegistroIntentos {
  intentos: number;
  bloqueadoHasta: number | null;
  ultimoIntento: number;
}

export interface EstadoBloqueoLogin {
  bloqueado: boolean;
  segundosRestantes: number;
  intentosRestantes: number;
}

@Injectable()
export class RateLimitService {
  private readonly intentosPorIdentificador = new Map<string, RegistroIntentos>();

  private normalizar(identificador: string): string {
    return identificador.trim().toLowerCase();
  }

  verificarEstadoBloqueo(identificador: string): EstadoBloqueoLogin {
    const clave = this.normalizar(identificador);
    const registro = this.intentosPorIdentificador.get(clave);
    const ahora = Date.now();

    if (!registro) {
      return {
        bloqueado: false,
        segundosRestantes: 0,
        intentosRestantes: MAX_INTENTOS_FALLIDOS,
      };
    }

    if (registro.bloqueadoHasta && ahora < registro.bloqueadoHasta) {
      return {
        bloqueado: true,
        segundosRestantes: Math.ceil((registro.bloqueadoHasta - ahora) / 1000),
        intentosRestantes: 0,
      };
    }

    if (registro.bloqueadoHasta && ahora >= registro.bloqueadoHasta) {
      this.intentosPorIdentificador.delete(clave);
      return {
        bloqueado: false,
        segundosRestantes: 0,
        intentosRestantes: MAX_INTENTOS_FALLIDOS,
      };
    }

    return {
      bloqueado: false,
      segundosRestantes: 0,
      intentosRestantes: Math.max(0, MAX_INTENTOS_FALLIDOS - registro.intentos),
    };
  }

  registrarIntentoFallido(identificador: string): EstadoBloqueoLogin {
    const clave = this.normalizar(identificador);
    const ahora = Date.now();
    const actual = this.intentosPorIdentificador.get(clave);
    const nuevosIntentos = (actual?.intentos ?? 0) + 1;
    const seBloquea = nuevosIntentos >= MAX_INTENTOS_FALLIDOS;

    this.intentosPorIdentificador.set(clave, {
      intentos: nuevosIntentos,
      bloqueadoHasta: seBloquea ? ahora + DURACION_BLOQUEO_MS : null,
      ultimoIntento: ahora,
    });

    return {
      bloqueado: seBloquea,
      segundosRestantes: seBloquea ? Math.ceil(DURACION_BLOQUEO_MS / 1000) : 0,
      intentosRestantes: Math.max(0, MAX_INTENTOS_FALLIDOS - nuevosIntentos),
    };
  }

  limpiarIntentosFallidos(identificador: string): void {
    this.intentosPorIdentificador.delete(this.normalizar(identificador));
  }
}
