
'use client';
import { Suspense } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { TransactionForm } from '../../transaction-form';
import { useDoc, useFirebase, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { Revenue, Expense } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

function EditTransactionPageContent() {
    const router = useRouter();
    const params = useParams();
    const searchParams = useSearchParams();
    const itemId = params.id as string;
    const transactionType = searchParams.get('type') as 'revenue' | 'expense' | null;

    const collectionName = transactionType === 'revenue' ? 'revenues' : 'expenses';
    
    const { firestore } = useFirebase();

    const itemDocRef = useMemoFirebase(() => {
        if (!firestore || !itemId || !transactionType) return null;
        return doc(firestore, collectionName, itemId);
    }, [firestore, itemId, transactionType]);

    const { data: item, isLoading } = useDoc<Revenue | Expense>(itemDocRef);

    const handleSuccess = () => {
      router.push('/cash-flow');
    };

    if (isLoading) {
        return (
             <div className="flex flex-col h-full">
                <PageHeader title="Carregando Lançamento..." />
                <main className="flex-1 overflow-auto p-4 md:p-6">
                    <div className="max-w-2xl mx-auto">
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
                            <CardTitle>Lançamento não encontrado</CardTitle>
                            <CardDescription>
                                O registro que você está tentando editar não foi encontrado.
                            </CardDescription>
                        </CardHeader>
                    </Card>
                </main>
            </div>
         )
    }

    const title = transactionType === 'revenue' ? 'Editar Receita' : 'Editar Despesa';
    const description = transactionType === 'revenue' ? 'Atualize os detalhes do lançamento de receita.' : 'Atualize os detalhes do lançamento de despesa.';
  
    return (
      <div className="flex flex-col h-full">
        <PageHeader title={title} />
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <div className="max-w-2xl mx-auto">
               <Card>
                  <CardHeader>
                      <CardTitle>{title}</CardTitle>
                      <CardDescription>
                          {description}
                      </CardDescription>
                  </CardHeader>
                  <CardContent>
                      <TransactionForm
                          transactionType={transactionType!}
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

export default function EditTransactionPage() {
    return (
        <Suspense fallback={<div>Carregando...</div>}>
            <EditTransactionPageContent />
        </Suspense>
    )
}
