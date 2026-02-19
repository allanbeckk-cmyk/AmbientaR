
'use client';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { InvoiceForm } from '../invoice-form';
import { useRouter } from 'next/navigation';
import { Suspense } from 'react';

function NewInvoicePageContent() {
    const router = useRouter();

    const handleSuccess = () => {
      router.push('/invoices');
    };
    
    const handleCancel = () => {
        router.back();
    }
  
    return (
      <div className="flex flex-col h-full">
        <PageHeader title="Nova Fatura" />
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <div className="max-w-2xl mx-auto">
               <Card>
                  <CardHeader>
                      <CardTitle>Adicionar Nova Fatura</CardTitle>
                      <CardDescription>
                          Preencha os detalhes para criar uma nova fatura.
                      </CardDescription>
                  </CardHeader>
                  <CardContent>
                      <InvoiceForm
                          currentItem={null}
                          onSuccess={handleSuccess}
                          onCancel={handleCancel}
                      />
                  </CardContent>
              </Card>
          </div>
        </main>
      </div>
    );
}

export default function NewInvoicePage() {
    return (
        <Suspense fallback={<div>Carregando...</div>}>
            <NewInvoicePageContent />
        </Suspense>
    )
}
