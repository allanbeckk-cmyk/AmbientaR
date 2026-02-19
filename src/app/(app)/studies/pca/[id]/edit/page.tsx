'use client';
import { Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PcaForm } from '../../pca-form';
import { useDoc, useFirebase, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { PCA } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

function EditPcaPageContent() {
    const router = useRouter();
    const params = useParams();
    const pcaId = params.id as string;
    
    const { firestore } = useFirebase();

    const pcaDocRef = useMemoFirebase(() => {
        if (!firestore || !pcaId) return null;
        return doc(firestore, 'pcas', pcaId);
    }, [firestore, pcaId]);

    const { data: pca, isLoading } = useDoc<PCA>(pcaDocRef);

    const handleSuccess = () => {
      router.push('/studies/pca');
    };

    if (isLoading) {
        return (
             <div className="flex flex-col h-full">
                <PageHeader title="Carregando PCA..." />
                <main className="flex-1 overflow-auto p-4 md:p-6">
                    <div className="max-w-7xl mx-auto">
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
    
    if (!pca && !isLoading) {
         return (
             <div className="flex flex-col h-full">
                <PageHeader title="Erro" />
                <main className="flex-1 overflow-auto p-4 md:p-6">
                     <Card>
                        <CardHeader>
                            <CardTitle>PCA não encontrado</CardTitle>
                            <CardDescription>
                                O relatório que você está tentando editar não foi encontrado.
                            </CardDescription>
                        </CardHeader>
                    </Card>
                </main>
            </div>
         )
    }
  
    return (
      <div className="flex flex-col h-full">
        <PageHeader title={`Editando PCA: ${pca?.empreendimento?.nome || '...'}`} />
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <div className="max-w-7xl mx-auto">
               <Card>
                  <CardHeader>
                      <CardTitle>Editar Plano de Controle Ambiental</CardTitle>
                      <CardDescription>
                          Atualize os detalhes do PCA abaixo.
                      </CardDescription>
                  </CardHeader>
                  <CardContent>
                      <PcaForm
                          currentItem={pca}
                          onSuccess={handleSuccess}
                      />
                  </CardContent>
              </Card>
          </div>
        </main>
      </div>
    );
}

export default function EditPcaPage() {
    return (
        <Suspense fallback={<div>Carregando...</div>}>
            <EditPcaPageContent />
        </Suspense>
    )
}
