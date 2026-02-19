
'use client';
import { Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { EiaRimaForm } from '../../eia-rima-form';
import { useDoc, useFirebase, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { EiaRima } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

function EditEiaRimaModalContent() {
    const router = useRouter();
    const params = useParams();
    const eiaRimaId = params.id as string;
    
    const { firestore } = useFirebase();

    const eiaRimaDocRef = useMemoFirebase(() => {
        if (!firestore || !eiaRimaId) return null;
        return doc(firestore, 'eiaRimas', eiaRimaId);
    }, [firestore, eiaRimaId]);

    const { data: eiaRima, isLoading } = useDoc<EiaRima>(eiaRimaDocRef);

    const handleSuccess = () => {
      router.back();
    };

    return (
       <Dialog open={true} onOpenChange={(isOpen) => !isOpen && router.back()}>
            <DialogContent className="sm:max-w-4xl h-full max-h-[90dvh] flex flex-col">
                 <DialogHeader>
                    <DialogTitle>Editar Estudo de Impacto Ambiental</DialogTitle>
                    <DialogDescription>
                        Atualize os detalhes do EIA/RIMA abaixo.
                    </DialogDescription>
                </DialogHeader>
                {isLoading && <div className="p-6"><Skeleton className="h-[400px] w-full" /></div>}
                {(!eiaRima && !isLoading) && <div className="p-6"><p>EIA/RIMA não encontrado.</p></div>}
                {eiaRima && (
                    <EiaRimaForm
                        currentItem={eiaRima}
                        onSuccess={handleSuccess}
                    />
                )}
            </DialogContent>
       </Dialog>
    );
}

export default function EditEiaRimaModal() {
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
            <EditEiaRimaModalContent />
        </Suspense>
    )
}
