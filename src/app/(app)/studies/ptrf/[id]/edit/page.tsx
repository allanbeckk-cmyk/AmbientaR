
'use client';
import { Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PtrfForm } from '../../ptrf-form';
import { useDoc, useFirebase, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { Prada as PTRF } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

function EditPtrfPageContent() {
    const router = useRouter();
    const params = useParams();
    const ptrfId = params.id as string;
    
    const { firestore } = useFirebase();

    const ptrfDocRef = useMemoFirebase(() => {
        if (!firestore || !ptrfId) return null;
        return doc(firestore, 'ptrfs', ptrfId);
    }, [firestore, ptrfId]);

    const { data: ptrf, isLoading } = useDoc<PTRF>(ptrfDocRef);

    const handleSuccess = () => {
      router.push('/studies/ptrf');
    };

    if (isLoading) {
        return (
             <div className="flex flex-col h-full">
                <PageHeader title="Carregando PTRF..." />
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
    
    if (!ptrf && !isLoading) {
         return (
             <div className="flex flex-col h-full">
                <PageHeader title="Erro" />
                <main className="flex-1 overflow-auto p-4 md:p-6">
                     <Card>
                        <CardHeader>
                            <CardTitle>PTRF não encontrado</CardTitle>
                            <CardDescription>
                                O formulário que você está tentando editar não foi encontrado.
                            </CardDescription>
                        </CardHeader>
                    </Card>
                </main>
            </div>
         )
    }
  
    return (
      <div className="flex flex-col h-full">
        <PageHeader title={`Editando PTRF: ${ptrf?.empreendimento?.nome || '...'}`} />
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <div className="max-w-7xl mx-auto">
               <Card>
                  <CardHeader>
                      <CardTitle>Editar Projeto Técnico de Recomposição de Flora</CardTitle>
                      <CardDescription>
                          Atualize os detalhes do PTRF abaixo.
                      </CardDescription>
                  </CardHeader>
                  <CardContent>
                      <PtrfForm
                          currentItem={ptrf}
                          onSuccess={handleSuccess}
                      />
                  </CardContent>
              </Card>
          </div>
        </main>
      </div>
    );
}

export default function EditPtrfPage() {
    return (
        <Suspense fallback={<div>Carregando...</div>}>
            <EditPtrfPageContent />
        </Suspense>
    )
}
