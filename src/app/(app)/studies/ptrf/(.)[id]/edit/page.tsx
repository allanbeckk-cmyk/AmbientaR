
'use client';
import { Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PtrfForm } from '../../ptrf-form';
import { useDoc, useFirebase, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { PTRF } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

function EditPtrfModalContent() {
    const router = useRouter();
    const params = useParams();
    const ptrfId = params.id as string;
    
    const { firestore } = useFirebase();

    const ptrfDocRef = useMemoFirebase(() => {
        if (!firestore || !ptrfId) return null;
        return doc(firestore, 'ptrfs', ptrfId);
    }, [firestore, ptrfId]);

    const { data: ptrf, isLoading } = useDoc<PTRF>(ptrfDocRef);

    const handleSuccess = () => {
      router.back();
    };

    return (
       <Dialog open={true} onOpenChange={(isOpen) => !isOpen && router.back()}>
            <DialogContent className="sm:max-w-4xl h-full max-h-[90dvh] flex flex-col">
                 <DialogHeader>
                    <DialogTitle>Editar Projeto Técnico de Recomposição de Flora</DialogTitle>
                    <DialogDescription>
                        Atualize os detalhes do PTRF abaixo.
                    </DialogDescription>
                </DialogHeader>
                {isLoading && <div className="p-6"><Skeleton className="h-[400px] w-full" /></div>}
                {(!ptrf && !isLoading) && <div className="p-6"><p>PTRF não encontrado.</p></div>}
                {ptrf && (
                    <PtrfForm
                        currentItem={ptrf}
                        onSuccess={handleSuccess}
                    />
                )}
            </DialogContent>
       </Dialog>
    );
}

export default function EditPtrfModal() {
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
            <EditPtrfModalContent />
        </Suspense>
    )
}
