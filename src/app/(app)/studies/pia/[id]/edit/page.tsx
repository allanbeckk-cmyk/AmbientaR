
'use client';
import { Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PiaForm } from '../../pia-form';
import { useDoc, useFirebase, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { PIA } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

function EditPiaPageContent() {
    const router = useRouter();
    const params = useParams();
    const piaId = params.id as string;
    
    const { firestore } = useFirebase();

    const piaDocRef = useMemoFirebase(() => {
        if (!firestore || !piaId) return null;
        return doc(firestore, 'pias', piaId);
    }, [firestore, piaId]);

    const { data: pia, isLoading } = useDoc<PIA>(piaDocRef);

    const handleSuccess = () => {
      router.push('/studies/pia');
    };

    if (isLoading) {
        return (
             <div className="flex flex-col h-full">
                <PageHeader title="Carregando PIA..." />
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
    
    if (!pia && !isLoading) {
         return (
             <div className="flex flex-col h-full">
                <PageHeader title="Erro" />
                <main className="flex-1 overflow-auto p-4 md:p-6">
                     <Card>
                        <CardHeader>
                            <CardTitle>PIA não encontrado</CardTitle>
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
        <PageHeader title={`Editando PIA: ${pia?.empreendimento?.nome || '...'}`} />
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <div className="max-w-7xl mx-auto">
               <Card>
                  <CardHeader>
                      <CardTitle>Editar Plano de Intervenção Ambiental ({pia?.type})</CardTitle>
                      <CardDescription>
                          Atualize os detalhes do PIA abaixo.
                      </CardDescription>
                  </CardHeader>
                  <CardContent>
                      <PiaForm
                          currentItem={pia}
                          piaType={pia?.type || null}
                          onSuccess={handleSuccess}
                      />
                  </CardContent>
              </Card>
          </div>
        </main>
      </div>
    );
}

export default function EditPiaPage() {
    return (
        <Suspense fallback={<div>Carregando...</div>}>
            <EditPiaPageContent />
        </Suspense>
    )
}
