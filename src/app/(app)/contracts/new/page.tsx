
'use client';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ContractForm } from '../contract-form';
import { useRouter } from 'next/navigation';
import { Suspense } from 'react';

function NewContractPageContent() {
    const router = useRouter();

    const handleSuccess = () => {
      router.push('/contracts');
    };
  
    return (
      <div className="flex flex-col h-full">
        <PageHeader title="Novo Contrato" />
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <div className="max-w-4xl mx-auto">
               <Card>
                  <CardHeader>
                      <CardTitle>Novo Contrato de Prestação de Serviço</CardTitle>
                      <CardDescription>
                          Preencha os campos para gerar um novo contrato.
                      </CardDescription>
                  </CardHeader>
                  <CardContent>
                      <ContractForm
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


export default function NewContractPage() {
    return (
        <Suspense fallback={<div>Carregando...</div>}>
            <NewContractPageContent />
        </Suspense>
    )
}
