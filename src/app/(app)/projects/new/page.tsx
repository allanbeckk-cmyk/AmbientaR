'use client';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ProjectForm } from '../project-form';
import { useRouter } from 'next/navigation';
import { Suspense } from 'react';

function NewProjectPageContent() {
    const router = useRouter();

    const handleSuccess = () => {
      router.push('/projects');
    };
  
    return (
      <div className="flex flex-col h-full">
        <PageHeader title="Novo Empreendimento" />
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <div className="max-w-5xl mx-auto">
               <Card>
                  <CardHeader>
                      <CardTitle>Adicionar Novo Empreendimento</CardTitle>
                      <CardDescription>
                          Preencha os detalhes para criar um novo empreendimento.
                      </CardDescription>
                  </CardHeader>
                  <CardContent>
                      <ProjectForm
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

export default function NewProjectPage() {
    return (
        <Suspense fallback={<div>Carregando...</div>}>
            <NewProjectPageContent />
        </Suspense>
    )
}
