
'use client';
import { Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PiaForm } from '../../pia-form';
import { useDoc, useFirebase, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { PIA } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

function EditPiaModalContent() {
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
      router.back();
    };

    return (
       <Dialog open={true} onOpenChange={(isOpen) => !isOpen && router.back()}>
            <DialogContent className="sm:max-w-7xl h-full max-h-[90dvh] flex flex-col">
                 <DialogHeader>
                    <DialogTitle>Editar Plano de Intervenção Ambiental ({pia?.type})</DialogTitle>
                    <DialogDescription>
                        Atualize os detalhes do PIA abaixo.
                    </DialogDescription>
                </DialogHeader>
                {isLoading && <div className="p-6"><Skeleton className="h-[400px] w-full" /></div>}
                {(!pia && !isLoading) && <div className="p-6"><p>PIA não encontrado.</p></div>}
                {pia && (
                    <PiaForm
                        currentItem={pia}
                        piaType={pia?.type || null}
                        onSuccess={handleSuccess}
                    />
                )}
            </DialogContent>
       </Dialog>
    );
}

export default function EditPiaModal() {
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
            <EditPiaModalContent />
        </Suspense>
    )
}
