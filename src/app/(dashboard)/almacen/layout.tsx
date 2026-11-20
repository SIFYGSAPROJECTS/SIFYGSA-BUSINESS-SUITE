import React from 'react';
import { AlmacenProvider } from '@/modules/almacen/context/AlmacenContext';
import { ComprasProvider } from '@/modules/compras/context/ComprasContext';

export default function AlmacenLayout({ children }: { children: React.ReactNode }) {
  return (
    <ComprasProvider>
      <AlmacenProvider>{children}</AlmacenProvider>
    </ComprasProvider>
  );
}
