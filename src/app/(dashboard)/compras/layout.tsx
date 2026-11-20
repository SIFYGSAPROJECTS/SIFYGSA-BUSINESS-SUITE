import React from 'react';
import { ComprasProvider } from '@/modules/compras/context/ComprasContext';

export default function ComprasLayout({ children }: { children: React.ReactNode }) {
  return <ComprasProvider>{children}</ComprasProvider>;
}

