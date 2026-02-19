'use client';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { EmpreendedorForm } from '../empreendedor-form';
import { useRouter } from 'next/navigation';
import { Suspense } from 'react';

function NewEmpreendedorPageContent() {
    const router = useRouter();

    const handleSuccess = () => {
      router.push('/empreendedores');
    };
  
    return (
      <div className="flex flex-col h-full">
        <PageHeader title="Novo Empreendedor" />
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <div className="max-w-4xl mx-auto">
               <Card>
                  <CardHeader>
                      <CardTitle>Adicionar Novo Empreendedor</CardTitle>
                      <CardDescription>
                          Preencha os detalhes para criar um novo empreendedor (cliente técnico).
                      </CardDescription>
                  </CardHeader>
                  <CardContent>
                      <EmpreendedorForm
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


export default function NewEmpreendedorPage() {
    return (
        <Suspense fallback={<div>Carregando...</div>}>
            <NewEmpreendedorPageContent />
        </Suspense>
    )
}
