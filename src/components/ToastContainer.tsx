'use client';

import * as React from 'react';
import { Toaster } from '@/components/ui/toaster';

export function ToastContainer() {
  const [isMounted, setIsMounted] = React.useState(false);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null; // Não renderiza nada no servidor
  }

  return <Toaster />;
}
