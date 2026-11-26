const ZONA_HORARIA_MX = 'America/Mexico_City';

/**
 * Devuelve una fecha en formato ISO-8601 con hora local de México (-06:00),
 * ej: "2026-11-25T09:06:15-06:00".
 * Mantiene compatibilidad total con new Date(...) y ordenamiento cronológico.
 */
export function formatearIsoMexico(fechaInput: Date | string = new Date()): string {
  const fecha = typeof fechaInput === 'string' ? new Date(fechaInput) : fechaInput;
  if (Number.isNaN(fecha.getTime())) {
    return new Date().toISOString();
  }

  const partes = new Intl.DateTimeFormat('en-CA', {
    timeZone: ZONA_HORARIA_MX,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(fecha);

  const get = (tipo: string) => partes.find((p) => p.type === tipo)?.value ?? '00';
  const hora = get('hour') === '24' ? '00' : get('hour');

  return `${get('year')}-${get('month')}-${get('day')}T${hora}:${get('minute')}:${get('second')}-06:00`;
}

/**
 * Devuelve una fecha y hora legible en formato México,
 * ej: "25/11/2026, 09:06:15 a.m."
 */
export function formatearFechaLegibleMx(fechaInput: Date | string = new Date()): string {
  const fecha = typeof fechaInput === 'string' ? new Date(fechaInput) : fechaInput;
  if (Number.isNaN(fecha.getTime())) return '';

  return fecha.toLocaleString('es-MX', {
    timeZone: ZONA_HORARIA_MX,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });
}

/**
 * Devuelve solo la hora legible en formato México, ej: "09:06 a.m."
 */
export function formatearHoraMx(fechaInput: Date | string = new Date()): string {
  const fecha = typeof fechaInput === 'string' ? new Date(fechaInput) : fechaInput;
  if (Number.isNaN(fecha.getTime())) return '';

  return fecha.toLocaleTimeString('es-MX', {
    timeZone: ZONA_HORARIA_MX,
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}
