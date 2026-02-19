'use client';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PiaForm } from '../pia-form';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import type { PiaType } from '@/lib/types';

function NewPiaPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const piaType = searchParams.get('type') as PiaType | null;

    const handleSuccess = () => {
      router.push('/studies/intervencao-ambiental');
    };
  
    return (
      <div className="flex flex-col h-full">
        <PageHeader title="Novo Plano de Intervenção Ambiental" />
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <div className="max-w-7xl mx-auto">
               <Card>
                  <CardHeader>
                      <CardTitle>Adicionar Novo PIA ({piaType || 'Tipo não selecionado'})</CardTitle>
                      <CardDescription>
                          Preencha os detalhes para criar um novo Plano de Intervenção Ambiental.
                      </CardDescription>
                  </CardHeader>
                  <CardContent>
                      <PiaForm
                          currentItem={null}
                          piaType={piaType}
                          onSuccess={handleSuccess}
                      />
                  </CardContent>
              </Card>
          </div>
        </main>
      </div>
    );
}

export default function NewPiaPage() {
    return (
        <Suspense fallback={<div>Carregando...</div>}>
            <NewPiaPageContent />
        </Suspense>
    )
}
