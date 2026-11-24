import { redirect } from 'next/navigation';

export default function PaginaOrdenesPorActualizarRedirect() {
  redirect('/compras/ordenes/editar-facturas?tab=por-actualizar');
}
