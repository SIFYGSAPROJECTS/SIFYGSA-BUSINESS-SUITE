import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { obtenerSesionActual } from '@/lib/auth';
import { puedeAccederModulo } from '@/lib/permissions';
import RecepcionMercanciaIR03Page from '@/modules/almacen/pages/RecepcionMercanciaIR03Page';

export default async function PaginaRecepcionIR03() {
  const sesion = await obtenerSesionActual();
  if (!sesion) {
    redirect('/login');
  }

  if (!puedeAccederModulo(sesion.rol, 'almacen', sesion.modulosPermitidos)) {
    redirect('/sin-acceso?modulo=Almacen');
  }

  return (
    <Suspense fallback={<div style={{ padding: '1.5rem' }}>Cargando Recepción IR03...</div>}>
      <RecepcionMercanciaIR03Page />
    </Suspense>
  );
}

