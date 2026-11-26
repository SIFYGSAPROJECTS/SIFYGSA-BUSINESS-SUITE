'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { INACTIVIDAD_MAXIMA_MS } from './session';

/**
 * Hook que monitorea la actividad del usuario en el navegador y cierra la sesión
 * automáticamente tras superar el tiempo máximo de inactividad.
 */
export function useMonitoreoInactividad(activo: boolean = true): void {
  const router = useRouter();
  const temporizadorRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!activo) return;

    const cerrarPorInactividad = async () => {
      try {
        await fetch('/api/auth/logout', { method: 'POST' });
      } finally {
        router.replace('/login?motivo=inactividad');
        router.refresh();
      }
    };

    const reiniciarTemporizador = () => {
      if (temporizadorRef.current) {
        clearTimeout(temporizadorRef.current);
      }
      temporizadorRef.current = setTimeout(() => {
        void cerrarPorInactividad();
      }, INACTIVIDAD_MAXIMA_MS);
    };

    const eventos: (keyof WindowEventMap)[] = [
      'mousemove',
      'mousedown',
      'keydown',
      'scroll',
      'touchstart',
    ];

    reiniciarTemporizador();
    for (const ev of eventos) {
      window.addEventListener(ev, reiniciarTemporizador, { passive: true });
    }

    return () => {
      if (temporizadorRef.current) {
        clearTimeout(temporizadorRef.current);
      }
      for (const ev of eventos) {
        window.removeEventListener(ev, reiniciarTemporizador);
      }
    };
  }, [activo, router]);
}
