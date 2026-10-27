import { redirect } from 'next/navigation';

export default async function PaginaDetalleOportunidadDinamica({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!id || !id.trim()) {
    redirect('/crm?sub=crm-opportunities');
  }
  redirect(`/crm?sub=crm-opportunity-detail&folio=${encodeURIComponent(id.trim())}`);
}
