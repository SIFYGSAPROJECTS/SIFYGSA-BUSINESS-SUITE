import { redirect } from 'next/navigation';
import { obtenerSesionActual } from '@/lib/auth';
import { GeneralDashboard } from '@/modules/dashboard/pages/GeneralDashboard';
import { HomeRH } from '@/modules/rh/pages/HomeRH';

export default async function PaginaHomeDashboard() {
  const sesion = await obtenerSesionActual();
  if (!sesion) {
    redirect('/login');
  }

  if (sesion.rol === 'rrhh') {
    return <HomeRH />;
  }

  if (
    sesion.departamento === 'Almacén & SGA' ||
    (sesion.modulosPermitidos.includes('almacen') &&
      !sesion.modulosPermitidos.includes('crm') &&
      sesion.rol !== 'administrador')
  ) {
    redirect('/almacen');
  }

  return <GeneralDashboard />;
}
