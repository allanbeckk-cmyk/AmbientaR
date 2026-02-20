'use client';

import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PtrfPradForm } from './form';
import { useRouter } from 'next/navigation';
import { Suspense } from 'react';

function PtrfPradPageContent() {
  const router = useRouter();

  const handleSuccess = () => {
    router.push('/studies/relatorios-diversos');
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <div className="flex flex-col h-full">
      <PageHeader title="Relatório Pericial de Acompanhamento PRAD/PTFR" />
      <main className="flex-1 overflow-auto p-4 md:p-6">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Relatório de Vistória de Acompanhamento de PRAD/PTRF</CardTitle>
              <CardDescription>
                Preencha os dados para gerar o relatório pericial de acompanhamento de execução de PRAD/PTFR.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PtrfPradForm onSuccess={handleSuccess} onCancel={handleCancel} />
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

export default function PtrfPradReportPage() {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <PtrfPradPageContent />
    </Suspense>
  );
}
