'use client';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PtrfForm } from '../ptrf-form';
import { useRouter } from 'next/navigation';
import { Suspense } from 'react';

function NewPtrfPageContent() {
    const router = useRouter();

    const handleSuccess = () => {
      router.push('/studies/ptrf');
    };
  
    return (
      <div className="flex flex-col h-full">
        <PageHeader title="Novo Projeto Técnico de Recomposição de Flora (PTRF)" />
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <div className="max-w-7xl mx-auto">
               <Card>
                  <CardHeader>
                      <CardTitle>Adicionar Novo PTRF</CardTitle>
                      <CardDescription>
                          Preencha os detalhes para criar um novo PTRF.
                      </CardDescription>
                  </CardHeader>
                  <CardContent>
                      <PtrfForm
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

export default function NewPtrfPage() {
    return (
        <Suspense fallback={<div>Carregando...</div>}>
            <NewPtrfPageContent />
        </Suspense>
    )
}
