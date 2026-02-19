
'use client';
import { Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ResponsibleForm } from '../../responsible-form';
import { useDoc, useFirebase, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { TechnicalResponsible } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

function EditResponsiblePageContent() {
    const router = useRouter();
    const params = useParams();
    const itemId = params.id as string;
    
    const { firestore } = useFirebase();

    const itemDocRef = useMemoFirebase(() => {
        if (!firestore || !itemId) return null;
        return doc(firestore, 'technicalResponsibles', itemId);
    }, [firestore, itemId]);

    const { data: item, isLoading } = useDoc<TechnicalResponsible>(itemDocRef);

    const handleSuccess = () => {
      router.push('/technical-responsible');
    };

    if (isLoading) {
        return (
             <div className="flex flex-col h-full">
                <PageHeader title="Carregando Responsável..." />
                <main className="flex-1 overflow-auto p-4 md:p-6">
                    <div className="max-w-2xl mx-auto">
                        <Card>
                            <CardHeader>
                                <Skeleton className="h-8 w-1/2" />
                                <Skeleton className="h-4 w-3/4" />
                            </CardHeader>
                            <CardContent>
                                <Skeleton className="h-[500px] w-full" />
                            </CardContent>
                        </Card>
                    </div>
                </main>
            </div>
        );
    }
    
    if (!item && !isLoading) {
         return (
             <div className="flex flex-col h-full">
                <PageHeader title="Erro" />
                <main className="flex-1 overflow-auto p-4 md:p-6">
                     <Card>
                        <CardHeader>
                            <CardTitle>Responsável não encontrado</CardTitle>
                            <CardDescription>
                                O registro que você está tentando editar não foi encontrado.
                            </CardDescription>
                        </CardHeader>
                    </Card>
                </main>
            </div>
         )
    }
  
    return (
      <div className="flex flex-col h-full">
        <PageHeader title={`Editando Responsável: ${item?.name || '...'}`} />
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <div className="max-w-2xl mx-auto">
               <Card>
                  <CardHeader>
                      <CardTitle>Editar Responsável Técnico</CardTitle>
                      <CardDescription>
                          Atualize os detalhes do profissional abaixo.
                      </CardDescription>
                  </CardHeader>
                  <CardContent>
                      <ResponsibleForm
                          currentItem={item}
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

export default function EditResponsiblePage() {
    return (
        <Suspense fallback={<div>Carregando...</div>}>
            <EditResponsiblePageContent />
        </Suspense>
    )
}
