'use client';
import { Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PradaForm } from '../../prada-form';
import { useDoc, useFirebase, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { Prada } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

function EditPradaPageContent() {
    const router = useRouter();
    const params = useParams();
    const pradaId = params.id as string;
    
    const { firestore } = useFirebase();

    const pradaDocRef = useMemoFirebase(() => {
        if (!firestore || !pradaId) return null;
        return doc(firestore, 'pradas', pradaId);
    }, [firestore, pradaId]);

    const { data: prada, isLoading } = useDoc<Prada>(pradaDocRef);

    const handleSuccess = () => {
      router.push('/studies/prada');
    };

    if (isLoading) {
        return (
             <div className="flex flex-col h-full">
                <PageHeader title="Carregando PRADA..." />
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
    
    if (!prada && !isLoading) {
         return (
             <div className="flex flex-col h-full">
                <PageHeader title="Erro" />
                <main className="flex-1 overflow-auto p-4 md:p-6">
                     <Card>
                        <CardHeader>
                            <CardTitle>PRADA não encontrado</CardTitle>
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
        <PageHeader title={`Editando PRADA: ${prada?.empreendimento?.nome || '...'}`} />
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <div className="max-w-7xl mx-auto">
               <Card>
                  <CardHeader>
                      <CardTitle>Editar Plano de Recuperação de Áreas Degradadas</CardTitle>
                      <CardDescription>
                          Atualize os detalhes do PRADA abaixo.
                      </CardDescription>
                  </CardHeader>
                  <CardContent>
                      <PradaForm
                          currentItem={prada}
                          onSuccess={handleSuccess}
                      />
                  </CardContent>
              </Card>
          </div>
        </main>
      </div>
    );
}

export default function EditPradaPage() {
    return (
        <Suspense fallback={<div>Carregando...</div>}>
            <EditPradaPageContent />
        </Suspense>
    )
}
