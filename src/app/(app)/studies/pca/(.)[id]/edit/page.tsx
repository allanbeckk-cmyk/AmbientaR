
'use client';
import { Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PcaForm } from '../../pca-form';
import { useDoc, useFirebase, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { PCA } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

function EditPcaModalContent() {
    const router = useRouter();
    const params = useParams();
    const pcaId = params.id as string;
    
    const { firestore } = useFirebase();

    const pcaDocRef = useMemoFirebase(() => {
        if (!firestore || !pcaId) return null;
        return doc(firestore, 'pcas', pcaId);
    }, [firestore, pcaId]);

    const { data: pca, isLoading } = useDoc<PCA>(pcaDocRef);

    const handleSuccess = () => {
      router.back();
    };

    return (
       <Dialog open={true} onOpenChange={(isOpen) => !isOpen && router.back()}>
            <DialogContent className="sm:max-w-7xl h-full max-h-[90dvh] flex flex-col">
                 <DialogHeader>
                    <DialogTitle>Editar Plano de Controle Ambiental</DialogTitle>
                    <DialogDescription>
                        Atualize os detalhes do PCA abaixo.
                    </DialogDescription>
                </DialogHeader>
                {isLoading && <div className="p-6"><Skeleton className="h-[400px] w-full" /></div>}
                {(!pca && !isLoading) && <div className="p-6"><p>PCA não encontrado.</p></div>}
                {pca && (
                    <PcaForm
                        currentItem={pca}
                        onSuccess={handleSuccess}
                    />
                )}
            </DialogContent>
       </Dialog>
    );
}

export default function EditPcaModal() {
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
            <EditPcaModalContent />
        </Suspense>
    )
}
