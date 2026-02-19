
'use client';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { OpportunityForm } from '../opportunity-form';
import { useRouter } from 'next/navigation';
import { Suspense } from 'react';

function NewOpportunityPageContent() {
    const router = useRouter();

    const handleSuccess = () => {
      router.push('/crm');
    };
  
    return (
      <div className="flex flex-col h-full">
        <PageHeader title="Nova Oportunidade" />
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <div className="max-w-2xl mx-auto">
               <Card>
                  <CardHeader>
                      <CardTitle>Adicionar Nova Oportunidade</CardTitle>
                      <CardDescription>
                          Preencha os detalhes para criar uma nova oportunidade de venda.
                      </CardDescription>
                  </CardHeader>
                  <CardContent>
                      <OpportunityForm
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

export default function NewOpportunityPage() {
    return (
        <Suspense fallback={<div>Carregando...</div>}>
            <NewOpportunityPageContent />
        </Suspense>
    )
}
