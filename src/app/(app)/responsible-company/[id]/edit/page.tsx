
'use client';
import { Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CompanyForm } from '../../company-form';
import { useDoc, useFirebase, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { EnvironmentalCompany } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

function EditCompanyPageContent() {
    const router = useRouter();
    const params = useParams();
    const itemId = params.id as string;
    
    const { firestore } = useFirebase();

    const itemDocRef = useMemoFirebase(() => {
        if (!firestore || !itemId) return null;
        return doc(firestore, 'environmentalCompanies', itemId);
    }, [firestore, itemId]);

    const { data: item, isLoading } = useDoc<EnvironmentalCompany>(itemDocRef);

    const handleSuccess = () => {
      router.push('/responsible-company');
    };

    if (isLoading) {
        return (
             <div className="flex flex-col h-full">
                <PageHeader title="Carregando Empresa..." />
                <main className="flex-1 overflow-auto p-4 md:p-6">
                    <div className="max-w-3xl mx-auto">
                        <Card>
                            <CardHeader>
                                <Skeleton className="h-8 w-1/2" />
                                <Skeleton className="h-4 w-3/4" />
                            </CardHeader>
                            <CardContent>
                                <Skeleton className="h-[400px] w-full" />
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
                            <CardTitle>Empresa não encontrada</CardTitle>
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
        <PageHeader title={`Editando Empresa: ${item?.name || '...'}`} />
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <div className="max-w-3xl mx-auto">
               <Card>
                  <CardHeader>
                      <CardTitle>Editar Empresa Responsável</CardTitle>
                      <CardDescription>
                          Atualize os detalhes da empresa abaixo.
                      </CardDescription>
                  </CardHeader>
                  <CardContent>
                      <CompanyForm
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

export default function EditCompanyPage() {
    return (
        <Suspense fallback={<div>Carregando...</div>}>
            <EditCompanyPageContent />
        </Suspense>
    )
}
