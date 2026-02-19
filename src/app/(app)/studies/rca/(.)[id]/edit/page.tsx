
'use client';

import { Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { RcaForm } from '../../rca-form';
import { useDoc, useFirebase, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { RCA } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

function EditRcaModalContent() {
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
      router.back();
    };

    return (
       <Dialog open={true} onOpenChange={(isOpen) => !isOpen && router.back()}>
            <DialogContent className="sm:max-w-7xl h-full max-h-[90dvh] flex flex-col">
                 <DialogHeader>
                    <DialogTitle>Editar Relatório de Controle Ambiental</DialogTitle>
                    <DialogDescription>
                        Atualize os detalhes do RCA abaixo.
                    </DialogDescription>
                </DialogHeader>
                {isLoading && <div className="p-6"><Skeleton className="h-[400px] w-full" /></div>}
                {(!rca && !isLoading) && <div className="p-6"><p>RCA não encontrado.</p></div>}
                {rca && (
                    <RcaForm
                        currentItem={rca}
                        onSuccess={handleSuccess}
                    />
                )}
            </DialogContent>
       </Dialog>
    );
}

export default function EditRcaModal() {
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
            <EditRcaModalContent />
        </Suspense>
    )
}
