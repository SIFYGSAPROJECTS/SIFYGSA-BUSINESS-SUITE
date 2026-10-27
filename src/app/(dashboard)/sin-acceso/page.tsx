import Link from 'next/link';
import { obtenerSesionActual } from '@/lib/auth';
import { obtenerRutaInicialParaUsuario } from '@/modules/registry';
import { NOMBRES_ROLES } from '@/config/types';

export default async function PaginaSinAcceso({
  searchParams,
}: {
  searchParams: Promise<{ modulo?: string }>;
}) {
  const params = await searchParams;
  const sesion = await obtenerSesionActual();
  const rutaRetorno = sesion
    ? obtenerRutaInicialParaUsuario(sesion.rol, sesion.modulosPermitidos)
    : '/login';

  return (
    <div
      style={{
        backgroundColor: 'var(--surface)',
        border: '1px solid var(--danger)',
        borderRadius: 'var(--radius-card)',
        padding: '2.5rem',
        maxWidth: '580px',
        margin: '3rem auto',
        textAlign: 'center',
        boxShadow: 'var(--shadow-md)',
      }}
    >
      <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🔒</div>
      <h1 style={{ margin: '0 0 0.5rem', fontSize: '1.4rem', fontWeight: 900 }}>
        Acceso Restringido por Rol (RBAC)
      </h1>
      <p style={{ margin: '0 0 1.25rem', color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5 }}>
        Tu cuenta actual ({sesion ? NOMBRES_ROLES[sesion.rol] : 'Invitado'}) no cuenta con los permisos necesarios en la matriz de seguridad para acceder al módulo{' '}
        <strong>{params.modulo ?? 'solicitado'}</strong>.
      </p>
      <Link
        href={rutaRetorno}
        style={{
          display: 'inline-block',
          padding: '0.6rem 1.2rem',
          borderRadius: 'var(--radius-control)',
          backgroundColor: 'var(--primary)',
          color: 'var(--on-primary)',
          fontWeight: 700,
          textDecoration: 'none',
          fontSize: '0.86rem',
        }}
      >
        Volver a mi módulo principal
      </Link>
    </div>
  );
}
