import { redirect } from 'next/navigation';

export default function PaginaOportunidadesSinId() {
  redirect('/crm?sub=crm-opportunities');
}
