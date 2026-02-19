'use client';

import { Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { RcaForm } from '../../rca-form';
import { useDoc, useFirebase, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { RCA } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

function EditRcaPageContent() {
    const router = useRouter();
    const params = useParams();
    const rcaId = params.id as string;
    
    const { firestore } = useFirebase();

    const rcaDocRef = useMemoFirebase(() => {
        if (!firestore || !rcaId) return null;
        return doc(firestore, 'rcas', rcaId);
    }, [firestore, rcaId]);

    const { data: rca, isLoading } = useDoc<RCA>(rcaDocRef);

    const handleSuccess = () => {
      router.push('/studies/rca');
    };

    if (isLoading) {
        return (
             <div className="flex flex-col h-full">
                <PageHeader title="Carregando RCA..." />
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
    
    if (!rca && !isLoading) {
         return (
             <div className="flex flex-col h-full">
                <PageHeader title="Erro" />
                <main className="flex-1 overflow-auto p-4 md:p-6">
                     <Card>
                        <CardHeader>
                            <CardTitle>RCA não encontrado</CardTitle>
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
        <PageHeader title={`Editando RCA: ${rca?.empreendimento?.nome || '...'}`} />
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <div className="max-w-7xl mx-auto">
               <Card>
                  <CardHeader>
                      <CardTitle>Editar Relatório de Controle Ambiental</CardTitle>
                      <CardDescription>
                          Atualize os detalhes do RCA abaixo.
                      </CardDescription>
                  </CardHeader>
                  <CardContent>
                      <RcaForm
                          currentItem={rca}
                          onSuccess={handleSuccess}
                      />
                  </CardContent>
              </Card>
          </div>
        </main>
      </div>
    );
}

export default function EditRcaPage() {
    return (
        <Suspense fallback={<div>Carregando...</div>}>
            <EditRcaPageContent />
        </Suspense>
    )
}
