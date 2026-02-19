
'use client';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { OutorgaForm } from '../outorga-form';
import { useRouter } from 'next/navigation';
import { Suspense } from 'react';

function NewOutorgaPageContent() {
    const router = useRouter();

    const handleSuccess = () => {
      router.push('/studies/outorgas');
    };
  
    return (
      <div className="flex flex-col h-full">
        <PageHeader title="Novo Pedido de Outorga" />
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <div className="max-w-2xl mx-auto">
               <Card>
                  <CardHeader>
                      <CardTitle>Adicionar Novo Pedido de Outorga</CardTitle>
                      <CardDescription>
                          Preencha os detalhes para criar um novo pedido.
                      </CardDescription>
                  </CardHeader>
                  <CardContent>
                      <OutorgaForm
                          currentItem={null}
                          onSuccess={handleSuccess}
                      />
                  </CardContent>
              </Card>
          </div>
        </main>
      </div>
    );
}

export default function NewOutorgaPage() {
    return (
        <Suspense fallback={<div>Carregando...</div>}>
            <NewOutorgaPageContent />
        </Suspense>
    )
}
