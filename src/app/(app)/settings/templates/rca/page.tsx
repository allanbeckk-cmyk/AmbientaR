'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RcaTemplateRedirectPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/settings/templates');
  }, [router]);
  return null;
}
