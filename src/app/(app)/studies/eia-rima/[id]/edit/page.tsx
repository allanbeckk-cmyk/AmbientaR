
'use client';
import { Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { EiaRimaForm } from '../../eia-rima-form';
import { useDoc, useFirebase, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { EiaRima } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

function EditEiaRimaPageContent() {
    const router = useRouter();
    const params = useParams();
    const eiaRimaId = params.id as string;
    
    const { firestore } = useFirebase();

    const eiaRimaDocRef = useMemoFirebase(() => {
        if (!firestore || !eiaRimaId) return null;
        return doc(firestore, 'eiaRimas', eiaRimaId);
    }, [firestore, eiaRimaId]);

    const { data: eiaRima, isLoading } = useDoc<EiaRima>(eiaRimaDocRef);

    const handleSuccess = () => {
      router.push('/studies/eia-rima');
    };

    if (isLoading) {
        return (
             <div className="flex flex-col h-full">
                <PageHeader title="Carregando EIA/RIMA..." />
                <main className="flex-1 overflow-auto p-4 md:p-6">
                    <div className="max-w-4xl mx-auto">
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
    
    if (!eiaRima && !isLoading) {
         return (
             <div className="flex flex-col h-full">
                <PageHeader title="Erro" />
                <main className="flex-1 overflow-auto p-4 md:p-6">
                     <Card>
                        <CardHeader>
                            <CardTitle>EIA/RIMA não encontrado</CardTitle>
                            <CardDescription>
                                O estudo que você está tentando editar não foi encontrado.
                            </CardDescription>
                        </CardHeader>
                    </Card>
                </main>
            </div>
         )
    }
  
    return (
      <div className="flex flex-col h-full">
        <PageHeader title={`Editando EIA/RIMA: ${eiaRima?.empreendimento?.nome || '...'}`} />
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <div className="max-w-4xl mx-auto">
               <Card>
                  <CardHeader>
                      <CardTitle>Editar Estudo de Impacto Ambiental</CardTitle>
                      <CardDescription>
                          Atualize os detalhes do EIA/RIMA abaixo.
                      </CardDescription>
                  </CardHeader>
                  <CardContent>
                      <EiaRimaForm
                          currentItem={eiaRima}
                          onSuccess={handleSuccess}
                      />
                  </CardContent>
              </Card>
          </div>
        </main>
      </div>
    );
}

export default function EditEiaRimaPage() {
    return (
        <Suspense fallback={<div>Carregando...</div>}>
            <EditEiaRimaPageContent />
        </Suspense>
    )
}

    