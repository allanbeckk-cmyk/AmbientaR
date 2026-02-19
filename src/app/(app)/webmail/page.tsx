'use client';

import { PageHeader } from '@/components/page-header';

export default function WebmailPage() {
  return (
    <div className="flex flex-col h-full">
      <PageHeader title="Webmail" />
      <main className="flex-1 overflow-auto p-0 md:p-0">
         <iframe 
            src="https://consultoriapimenta.com.br:2096/"
            className="w-full h-full border-0"
            title="Webmail"
        ></iframe>
      </main>
    </div>
  );
}
