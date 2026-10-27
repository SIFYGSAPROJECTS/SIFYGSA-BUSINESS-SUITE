import { redirect } from 'next/navigation';
import { NOMBRES_ROLES } from '@/config/types';
import { obtenerSesionActual } from '@/lib/auth';
import { SettingsPage } from '@/modules/settings/pages/SettingsPage';

export default async function PaginaAjustes() {
  const sesion = await obtenerSesionActual();
  if (!sesion) {
    redirect('/login');
  }

  return (
    <SettingsPage
      user={{
        name: sesion.nombre,
        email: sesion.email,
        role: NOMBRES_ROLES[sesion.rol],
      }}
    />
  );
}
