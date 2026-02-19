'use client';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PradaForm } from '../prada-form';
import { useRouter } from 'next/navigation';
import { Suspense } from 'react';

function NewPradaPageContent() {
    const router = useRouter();

    const handleSuccess = () => {
      router.push('/studies/prada');
    };
  
    return (
      <div className="flex flex-col h-full">
        <PageHeader title="Novo Plano de Recuperação de Áreas Degradadas (PRADA)" />
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <div className="max-w-7xl mx-auto">
               <Card>
                  <CardHeader>
                      <CardTitle>Adicionar Novo PRADA</CardTitle>
                      <CardDescription>
                          Preencha os detalhes para criar um novo PRADA.
                      </CardDescription>
                  </CardHeader>
                  <CardContent>
                      <PradaForm
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

export default function NewPradaPage() {
    return (
        <Suspense fallback={<div>Carregando...</div>}>
            <NewPradaPageContent />
        </Suspense>
    )
}
