
'use client';
import { Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { InvoiceForm } from '../invoice-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';

function NewInvoiceModalContent() {
    const router = useRouter();

    const handleSuccess = () => {
      router.back();
    };
  
    return (
        <Dialog open={true} onOpenChange={(isOpen) => !isOpen && router.back()}>
            <DialogContent className="sm:max-w-2xl h-full max-h-[90dvh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Adicionar Nova Fatura</DialogTitle>
                    <DialogDescription>
                        Preencha os detalhes para criar uma nova fatura.
                    </DialogDescription>
                </DialogHeader>
                <InvoiceForm
                    currentItem={null}
                    onSuccess={handleSuccess}
                    onCancel={() => router.back()}
                />
            </DialogContent>
        </Dialog>
    );
}


export default function NewInvoiceModal() {
    return (
        <Suspense fallback={
             <Dialog open={true}>
                <DialogContent>
                     <DialogHeader>
                        <DialogTitle>Carregando...</DialogTitle>
                    </DialogHeader>
                    <Skeleton className="h-[500px] w-full" />
                </DialogContent>
             </Dialog>
        }>
            <NewInvoiceModalContent />
        </Suspense>
    )
}
