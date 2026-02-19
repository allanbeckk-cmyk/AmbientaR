
'use client';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { TransactionForm } from '../transaction-form';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function NewTransactionPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const transactionType = searchParams.get('type') as 'revenue' | 'expense' | null;

    const handleSuccess = () => {
      router.push('/cash-flow');
    };

    const handleCancel = () => {
        router.back();
    }

    if (!transactionType) {
        return (
            <div className="flex flex-col h-full">
                <PageHeader title="Tipo de Transação Inválido" />
                <main className="flex-1 overflow-auto p-4 md:p-6">
                    <p>Por favor, especifique um tipo de transação (receita ou despesa).</p>
                </main>
            </div>
        )
    }

    const title = transactionType === 'revenue' ? 'Nova Receita' : 'Nova Despesa';
    const description = transactionType === 'revenue' ? 'Preencha os detalhes para criar um novo lançamento de receita.' : 'Preencha os detalhes para criar um novo lançamento de despesa.';
  
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
                          transactionType={transactionType}
                          currentItem={null}
                          onSuccess={handleSuccess}
                          onCancel={handleCancel}
                      />
                  </CardContent>
              </Card>
          </div>
        </main>
      </div>
    );
}

export default function NewTransactionPage() {
    return (
        <Suspense fallback={<div>Carregando...</div>}>
            <NewTransactionPageContent />
        </Suspense>
    )
}
