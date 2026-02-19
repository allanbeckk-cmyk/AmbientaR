
'use client';
import { Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PradaForm } from '../../prada-form';
import { useDoc, useFirebase, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { Prada } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

function EditPradaModalContent() {
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
      router.back();
    };

    return (
       <Dialog open={true} onOpenChange={(isOpen) => !isOpen && router.back()}>
            <DialogContent className="sm:max-w-7xl h-full max-h-[90dvh] flex flex-col">
                 <DialogHeader>
                    <DialogTitle>Editar Plano de Recuperação de Áreas Degradadas</DialogTitle>
                    <DialogDescription>
                        Atualize os detalhes do PRADA abaixo.
                    </DialogDescription>
                </DialogHeader>
                {isLoading && <div className="p-6"><Skeleton className="h-[400px] w-full" /></div>}
                {(!prada && !isLoading) && <div className="p-6"><p>PRADA não encontrado.</p></div>}
                {prada && (
                    <PradaForm
                        currentItem={prada}
                        onSuccess={handleSuccess}
                    />
                )}
            </DialogContent>
       </Dialog>
    );
}

export default function EditPradaModal() {
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
            <EditPradaModalContent />
        </Suspense>
    )
}
