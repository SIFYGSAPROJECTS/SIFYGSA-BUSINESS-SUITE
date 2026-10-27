import React, { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { obtenerSesionActual } from '@/lib/auth';
import { MainLayout } from '@/components/layout/MainLayout';

export default async function LayoutDashboard({
  children,
}: {
  children: React.ReactNode;
}) {
  const sesion = await obtenerSesionActual();
  if (!sesion) {
    redirect('/login');
  }

  return (
    <Suspense fallback={<div style={{ padding: '2rem' }}>Cargando SIFYGSUITE...</div>}>
      <MainLayout
        usuario={{
          id: sesion.sub,
          nombre: sesion.nombre,
          email: sesion.email,
          rol: sesion.rol,
          zona: sesion.zona,
          modulosPermitidos: sesion.modulosPermitidos,
        }}
      >
        {children}
      </MainLayout>
    </Suspense>
  );
}
