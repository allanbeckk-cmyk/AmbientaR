
'use client';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { SupplierForm } from '../supplier-form';
import { useRouter } from 'next/navigation';
import { Suspense } from 'react';

function NewSupplierPageContent() {
    const router = useRouter();

    const handleSuccess = () => {
      router.push('/suppliers');
    };

    const handleCancel = () => {
        router.back();
    }
  
    return (
      <div className="flex flex-col h-full">
        <PageHeader title="Novo Fornecedor" />
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <div className="max-w-2xl mx-auto">
               <Card>
                  <CardHeader>
                      <CardTitle>Adicionar Novo Fornecedor</CardTitle>
                      <CardDescription>
                          Preencha os detalhes para criar um novo fornecedor.
                      </CardDescription>
                  </CardHeader>
                  <CardContent>
                      <SupplierForm
                          currentItem={null}
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

export default function NewSupplierPage() {
    return (
        <Suspense fallback={<div>Carregando...</div>}>
            <NewSupplierPageContent />
        </Suspense>
    )
}
