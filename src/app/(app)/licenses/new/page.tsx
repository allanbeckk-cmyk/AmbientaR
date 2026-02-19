
'use client';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { LicenseForm } from '../license-form';
import { useRouter } from 'next/navigation';
import { Suspense } from 'react';

function NewLicensePageContent() {
    const router = useRouter();

    const handleSuccess = () => {
      router.push('/licenses');
    };
  
    return (
      <div className="flex flex-col h-full">
        <PageHeader title="Nova Licença Ambiental" />
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <div className="max-w-2xl mx-auto">
               <Card>
                  <CardHeader>
                      <CardTitle>Adicionar Nova Licença</CardTitle>
                      <CardDescription>
                          Preencha os detalhes para criar uma nova licença.
                      </CardDescription>
                  </CardHeader>
                  <CardContent>
                      <LicenseForm
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

export default function NewLicensePage() {
    return (
        <Suspense fallback={<div>Carregando...</div>}>
            <NewLicensePageContent />
        </Suspense>
    )
}
