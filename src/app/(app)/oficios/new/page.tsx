'use client';
import { Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { OficioForm } from '../oficio-form';

function NewOficioPageContent() {
    const router = useRouter();

    const handleSuccess = () => {
      router.push('/oficios');
    };
  
    return (
      <div className="flex flex-col h-full">
        <PageHeader title="Novo Ofício" />
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <div className="max-w-4xl mx-auto">
               <Card>
                  <CardHeader>
                      <CardTitle>Criar Novo Ofício</CardTitle>
                      <CardDescription>
                          Preencha os detalhes para criar um novo ofício. Você pode salvar como rascunho.
                      </CardDescription>
                  </CardHeader>
                  <CardContent>
                      <OficioForm
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

export default function NewOficioPage() {
    return (
        <Suspense fallback={<div>Carregando...</div>}>
            <NewOficioPageContent />
        </Suspense>
    )
}
