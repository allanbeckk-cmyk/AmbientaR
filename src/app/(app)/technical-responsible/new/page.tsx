
'use client';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ResponsibleForm } from '../responsible-form';
import { useRouter } from 'next/navigation';
import { Suspense } from 'react';

function NewResponsiblePageContent() {
    const router = useRouter();

    const handleSuccess = () => {
      router.push('/technical-responsible');
    };
  
    return (
      <div className="flex flex-col h-full">
        <PageHeader title="Novo Responsável Técnico" />
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <div className="max-w-2xl mx-auto">
               <Card>
                  <CardHeader>
                      <CardTitle>Adicionar Novo Responsável</CardTitle>
                      <CardDescription>
                          Preencha os detalhes para cadastrar um novo profissional.
                      </CardDescription>
                  </CardHeader>
                  <CardContent>
                      <ResponsibleForm
                          currentItem={null}
                          onSuccess={handleSuccess}
                          onCancel={() => router.back()}
                      />
                  </CardContent>
              </Card>
          </div>
        </main>
      </div>
    );
}


export default function NewResponsiblePage() {
    return (
        <Suspense fallback={<div>Carregando...</div>}>
            <NewResponsiblePageContent />
        </Suspense>
    )
}
