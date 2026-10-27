export const MAX_INTENTOS_FALLIDOS = 5;
export const DURACION_BLOQUEO_MS = 5 * 60 * 1000; // 5 minutos

interface RegistroIntentos {
  intentos: number;
  bloqueadoHasta: number | null;
  ultimoIntento: number;
}

const intentosPorIdentificador = new Map<string, RegistroIntentos>();

function normalizarClave(identificador: string): string {
  return identificador.trim().toLowerCase();
}

export interface EstadoBloqueoLogin {
  bloqueado: boolean;
  segundosRestantes: number;
  intentosRestantes: number;
}

export function verificarEstadoBloqueo(identificador: string): EstadoBloqueoLogin {
  const clave = normalizarClave(identificador);
  const registro = intentosPorIdentificador.get(clave);
  const ahora = Date.now();

  if (!registro) {
    return {
      bloqueado: false,
      segundosRestantes: 0,
      intentosRestantes: MAX_INTENTOS_FALLIDOS,
    };
  }

  if (registro.bloqueadoHasta && ahora < registro.bloqueadoHasta) {
    const segundosRestantes = Math.ceil((registro.bloqueadoHasta - ahora) / 1000);
    return {
      bloqueado: true,
      segundosRestantes,
      intentosRestantes: 0,
    };
  }

  if (registro.bloqueadoHasta && ahora >= registro.bloqueadoHasta) {
    intentosPorIdentificador.delete(clave);
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

export function registrarIntentoFallido(identificador: string): EstadoBloqueoLogin {
  const clave = normalizarClave(identificador);
  const ahora = Date.now();
  const actual = intentosPorIdentificador.get(clave);

  const nuevosIntentos = (actual?.intentos ?? 0) + 1;
  const seBloquea = nuevosIntentos >= MAX_INTENTOS_FALLIDOS;
  const bloqueadoHasta = seBloquea ? ahora + DURACION_BLOQUEO_MS : null;

  intentosPorIdentificador.set(clave, {
    intentos: nuevosIntentos,
    bloqueadoHasta,
    ultimoIntento: ahora,
  });

  return {
    bloqueado: seBloquea,
    segundosRestantes: seBloquea ? Math.ceil(DURACION_BLOQUEO_MS / 1000) : 0,
    intentosRestantes: Math.max(0, MAX_INTENTOS_FALLIDOS - nuevosIntentos),
  };
}

export function limpiarIntentosFallidos(identificador: string): void {
  intentosPorIdentificador.delete(normalizarClave(identificador));
}
