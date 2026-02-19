
'use client';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ServiceForm } from '../service-form';
import { useRouter } from 'next/navigation';
import { Suspense } from 'react';

function NewServicePageContent() {
    const router = useRouter();

    const handleSuccess = () => {
      router.push('/services');
    };

    const handleCancel = () => {
        router.back();
    }
  
    return (
      <div className="flex flex-col h-full">
        <PageHeader title="Novo Serviço" />
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <div className="max-w-2xl mx-auto">
               <Card>
                  <CardHeader>
                      <CardTitle>Adicionar Novo Serviço</CardTitle>
                      <CardDescription>
                          Preencha os detalhes para criar um novo serviço na sua tabela.
                      </CardDescription>
                  </CardHeader>
                  <CardContent>
                      <ServiceForm
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

export default function NewServicePage() {
    return (
        <Suspense fallback={<div>Carregando...</div>}>
            <NewServicePageContent />
        </Suspense>
    )
}
