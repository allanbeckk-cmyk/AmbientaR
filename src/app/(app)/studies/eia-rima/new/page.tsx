
'use client';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { EiaRimaForm } from '../eia-rima-form';
import { useRouter } from 'next/navigation';
import { Suspense } from 'react';

function NewEiaRimaPageContent() {
    const router = useRouter();

    const handleSuccess = () => {
      router.push('/studies/eia-rima');
    };
  
    return (
      <div className="flex flex-col h-full">
        <PageHeader title="Novo Estudo de Impacto Ambiental (EIA/RIMA)" />
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <div className="max-w-4xl mx-auto">
               <Card>
                  <CardHeader>
                      <CardTitle>Adicionar Novo EIA/RIMA</CardTitle>
                      <CardDescription>
                          Preencha os detalhes para criar um novo Estudo de Impacto Ambiental.
                      </CardDescription>
                  </CardHeader>
                  <CardContent>
                      <EiaRimaForm
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

export default function NewEiaRimaPage() {
    return (
        <Suspense fallback={<div>Carregando...</div>}>
            <NewEiaRimaPageContent />
        </Suspense>
    )
}

    