
'use client';
import { Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { OutorgaForm } from '../../outorga-form';
import { useDoc, useFirebase, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { WaterPermit } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

function EditOutorgaModalContent() {
    const router = useRouter();
    const params = useParams();
    const itemId = params.id as string;
    
    const { firestore } = useFirebase();

    const itemDocRef = useMemoFirebase(() => {
        if (!firestore || !itemId) return null;
        return doc(firestore, 'outorgas', itemId);
    }, [firestore, itemId]);

    const { data: item, isLoading } = useDoc<WaterPermit>(itemDocRef);

    const handleSuccess = () => {
      router.back();
    };

    return (
       <Dialog open={true} onOpenChange={(isOpen) => !isOpen && router.back()}>
            <DialogContent className="sm:max-w-2xl h-full max-h-[90dvh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Editar Outorga</DialogTitle>
                    <DialogDescription>Atualize os detalhes da outorga abaixo.</DialogDescription>
                </DialogHeader>
                {isLoading && <div className="p-6"><Skeleton className="h-[400px] w-full" /></div>}
                {(!item && !isLoading) && <div className="p-6"><p>Outorga não encontrada.</p></div>}
                {item && (
                    <OutorgaForm
                        currentItem={item}
                        onSuccess={handleSuccess}
                    />
                )}
            </DialogContent>
       </Dialog>
    );
}

export default function EditOutorgaModal() {
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
            <EditOutorgaModalContent />
        </Suspense>
    )
}
