
'use client';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CharcoalProductionForm } from './charcoal-form';
import { useRouter } from 'next/navigation';
import { Suspense } from 'react';

function CharcoalReportPageContent() {
    const router = useRouter();

    const handleSuccess = () => {
      router.push('/studies/relatorios-diversos');
    };

    const handleCancel = () => {
        router.back();
    }
  
    return (
      <div className="flex flex-col h-full">
        <PageHeader title="Relatório de Performance da Produção de Carvão Vegetal" />
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <div className="max-w-4xl mx-auto">
               <Card>
                  <CardHeader>
                      <CardTitle>Novo Relatório</CardTitle>
                      <CardDescription>
                          Preencha os dados para gerar o relatório de performance.
                      </CardDescription>
                  </CardHeader>
                  <CardContent>
                      <CharcoalProductionForm
                          onSuccess={handleSuccess}
                          onCancel={handleCancel}
                      />
                  </CardContent>
              </Card>
          </div>
        </main>
      </div>
    );
}

export default function CharcoalReportPage() {
    return (
        <Suspense fallback={<div>Carregando...</div>}>
            <CharcoalReportPageContent />
        </Suspense>
    )
}
