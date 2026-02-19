
'use client';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DispensaForm } from '../dispensa-form';
import { useRouter } from 'next/navigation';
import { Suspense } from 'react';

function SolicitarDispensaPageContent() {
    const router = useRouter();

    const handleSuccess = () => {
      // Navigate to a relevant page after success, e.g., the main education page
      router.push('/studies/educacao-ambiental');
    };
  
    return (
      <div className="flex flex-col h-full">
        <PageHeader title="Solicitação de Dispensa do Programa de Educação Ambiental" />
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <div className="max-w-4xl mx-auto">
               <Card>
                  <CardHeader>
                      <CardTitle>Formulário de Solicitação de Dispensa</CardTitle>
                      <CardDescription>
                          Preencha os detalhes para formalizar a solicitação de dispensa do PEA.
                      </CardDescription>
                  </CardHeader>
                  <CardContent>
                      <DispensaForm
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

export default function SolicitarDispensaPage() {
    return (
        <Suspense fallback={<div>Carregando...</div>}>
            <SolicitarDispensaPageContent />
        </Suspense>
    )
}
