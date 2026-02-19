
'use client';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { TransporteResiduosForm } from './form';
import { useRouter } from 'next/navigation';
import { Suspense } from 'react';

function TransporteResiduosPageContent() {
    const router = useRouter();

    const handleSuccess = () => {
      router.push('/studies/relatorios-diversos');
    };

    const handleCancel = () => {
        router.back();
    }
  
    return (
      <div className="flex flex-col h-full">
        <PageHeader title="Relatório de Transporte de Produtos/Resíduos Perigosos" />
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <div className="max-w-4xl mx-auto">
               <Card>
                  <CardHeader>
                      <CardTitle>Novo Relatório Descritivo (LAS-CADASTRO)</CardTitle>
                      <CardDescription>
                          Preencha os dados para gerar o relatório para a atividade de transporte.
                      </CardDescription>
                  </CardHeader>
                  <CardContent>
                      <TransporteResiduosForm
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

export default function TransporteResiduosPage() {
    return (
        <Suspense fallback={<div>Carregando...</div>}>
            <TransporteResiduosPageContent />
        </Suspense>
    )
}
