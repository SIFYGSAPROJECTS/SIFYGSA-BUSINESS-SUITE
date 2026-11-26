import { redirect } from 'next/navigation';

export default function PaginaOrdenesPendientesRedirect() {
  redirect('/compras/ordenes/editar-facturas?tab=pendientes');
}
