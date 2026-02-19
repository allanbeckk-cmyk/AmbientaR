
'use client';

import * as React from 'react';
import { useSearchParams } from 'next/navigation';
import { PageHeader } from '@/components/page-header';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

function ExternalPageContent() {
  const searchParams = useSearchParams();
  const url = searchParams.get('url');
  const title = searchParams.get('title');

  // If the link is for a site that blocks iframing, this will be true
  const openInNewTab = searchParams.get('newTab') === 'true';

  React.useEffect(() => {
    if (openInNewTab && url) {
      window.open(url, '_blank');
      // Optionally, you can show a message or redirect back
      // For now, we'll show a message.
    }
  }, [openInNewTab, url]);


  if (openInNewTab) {
      return (
         <div className="flex flex-col h-full">
            <PageHeader title={title || 'Link Externo'} />
            <main className="flex-1 overflow-auto p-4 md:p-6 flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-xl font-semibold">Redirecionando...</h2>
                    <p className="text-muted-foreground mt-2">
                        Esta página foi aberta em uma nova aba para garantir a funcionalidade.
                    </p>
                    <p className='text-sm text-muted-foreground mt-1'>
                        Se a nova aba não abriu, verifique se seu navegador bloqueou o pop-up.
                    </p>
                </div>
            </main>
        </div>
      )
  }

  if (!url) {
    return (
      <div className="flex flex-col h-full">
        <PageHeader title="Erro" />
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <p>URL não fornecida.</p>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <PageHeader title={title || 'Link Externo'} />
      <main className="flex-1 overflow-hidden">
        <iframe
          src={url}
          className="w-full h-full border-0"
          title={title || 'External Content'}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          // Add sandbox attribute for extra security, though it might restrict some sites
          // sandbox="allow-scripts allow-same-origin allow-forms"
        ></iframe>
      </main>
    </div>
  );
}


export default function ExternalPage() {
    return (
        <Suspense fallback={
             <div className="flex flex-col h-full">
                <PageHeader title="Carregando..." />
                <main className="flex-1 overflow-auto p-4 md:p-6">
                   <Skeleton className="w-full h-full" />
                </main>
            </div>
        }>
            <ExternalPageContent />
        </Suspense>
    )
}
