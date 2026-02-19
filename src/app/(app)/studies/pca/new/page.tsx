'use client';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PcaForm } from '../pca-form';
import { useRouter } from 'next/navigation';
import { Suspense } from 'react';

function NewPcaPageContent() {
    const router = useRouter();

    const handleSuccess = () => {
      router.push('/studies/pca');
    };
  
    return (
      <div className="flex flex-col h-full">
        <PageHeader title="Novo Plano de Controle Ambiental (PCA)" />
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <div className="max-w-7xl mx-auto">
               <Card>
                  <CardHeader>
                      <CardTitle>Adicionar Novo PCA</CardTitle>
                      <CardDescription>
                          Preencha os detalhes para criar um novo Plano de Controle Ambiental.
                      </CardDescription>
                  </CardHeader>
                  <CardContent>
                      <PcaForm
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

export default function NewPcaPage() {
    return (
        <Suspense fallback={<div>Carregando...</div>}>
            <NewPcaPageContent />
        </Suspense>
    )
}
