import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { obtenerSesionActual } from '@/lib/auth';
import { puedeAccederModulo } from '@/lib/permissions';
import {
  calcularMetricasCrm,
  obtenerDatosCrm,
} from '@/modules/crm/services/crm.service';
import { ContenedorCrmCliente } from '@/modules/crm/components/ContenedorCrmCliente';

export default async function PaginaModuloCrm() {
  const sesion = await obtenerSesionActual();
  if (!sesion) {
    redirect('/login');
  }

  if (!puedeAccederModulo(sesion.rol, 'crm', sesion.modulosPermitidos)) {
    redirect('/sin-acceso?modulo=CRM+%26+Ventas');
  }

  const datos = await obtenerDatosCrm();
  const metricas = calcularMetricasCrm(datos.oportunidades, sesion.zona);

  return (
    <Suspense fallback={<div style={{ padding: '1.5rem' }}>Cargando módulo CRM...</div>}>
      <ContenedorCrmCliente
        datosIniciales={datos}
        metricasIniciales={metricas}
        rolUsuario={sesion.rol}
        zonaUsuario={sesion.zona}
      />
    </Suspense>
  );
}
