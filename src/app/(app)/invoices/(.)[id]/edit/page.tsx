
'use client';
import { Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { InvoiceForm } from '../../invoice-form';
import { useDoc, useFirebase, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { Invoice } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

function EditInvoiceModalContent() {
    const router = useRouter();
    const params = useParams();
    const itemId = params.id as string;
    
    const { firestore } = useFirebase();

    const itemDocRef = useMemoFirebase(() => {
        if (!firestore || !itemId) return null;
        return doc(firestore, 'invoices', itemId);
    }, [firestore, itemId]);

    const { data: item, isLoading } = useDoc<Invoice>(itemDocRef);

    const handleSuccess = () => {
      router.back();
    };

    return (
       <Dialog open={true} onOpenChange={(isOpen) => !isOpen && router.back()}>
            <DialogContent className="sm:max-w-2xl h-full max-h-[90dvh] flex flex-col">
                 <DialogHeader>
                    <DialogTitle>Editar Fatura</DialogTitle>
                    <DialogDescription>
                        Atualize os detalhes da fatura abaixo.
                    </DialogDescription>
                </DialogHeader>
                {isLoading && <div className="p-6"><Skeleton className="h-[400px] w-full" /></div>}
                {(!item && !isLoading) && <div className="p-6"><p>Fatura não encontrada.</p></div>}
                {item && (
                    <InvoiceForm
                        currentItem={item}
                        onSuccess={handleSuccess}
                        onCancel={() => router.back()}
                    />
                )}
            </DialogContent>
       </Dialog>
    );
}

export default function EditInvoiceModal() {
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
            <EditInvoiceModalContent />
        </Suspense>
    )
}
