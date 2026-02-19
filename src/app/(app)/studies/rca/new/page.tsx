'use client';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { RcaForm } from '../rca-form';
import { useRouter } from 'next/navigation';
import { Suspense } from 'react';

function NewRcaPageContent() {
    const router = useRouter();

    const handleSuccess = () => {
      router.push('/studies/rca');
    };
  
    return (
      <div className="flex flex-col h-full">
        <PageHeader title="Novo Relatório de Controle Ambiental" />
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <div className="max-w-7xl mx-auto">
               <Card>
                  <CardHeader>
                      <CardTitle>Adicionar Novo RCA</CardTitle>
                      <CardDescription>
                          Preencha os detalhes para criar um novo Relatório de Controle Ambiental.
                      </CardDescription>
                  </CardHeader>
                  <CardContent>
                      <RcaForm
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

export default function NewRcaPage() {
    return (
        <Suspense fallback={<div>Carregando...</div>}>
            <NewRcaPageContent />
        </Suspense>
    )
}
