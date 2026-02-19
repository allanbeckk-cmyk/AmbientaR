
'use client';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CompanyForm } from '../company-form';
import { useRouter } from 'next/navigation';
import { Suspense } from 'react';

function NewCompanyPageContent() {
    const router = useRouter();

    const handleSuccess = () => {
      router.push('/responsible-company');
    };
  
    return (
      <div className="flex flex-col h-full">
        <PageHeader title="Nova Empresa Responsável" />
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <div className="max-w-3xl mx-auto">
               <Card>
                  <CardHeader>
                      <CardTitle>Adicionar Nova Empresa</CardTitle>
                      <CardDescription>
                          Preencha os detalhes para cadastrar uma nova empresa parceira.
                      </CardDescription>
                  </CardHeader>
                  <CardContent>
                      <CompanyForm
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

export default function NewCompanyPage() {
    return (
        <Suspense fallback={<div>Carregando...</div>}>
            <NewCompanyPageContent />
        </Suspense>
    )
}
