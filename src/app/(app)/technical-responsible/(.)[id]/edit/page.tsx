
'use client';
import { Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ResponsibleForm } from '../../responsible-form';
import { useDoc, useFirebase, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { TechnicalResponsible } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

function EditResponsibleModalContent() {
    const router = useRouter();
    const params = useParams();
    const itemId = params.id as string;
    
    const { firestore } = useFirebase();

    const itemDocRef = useMemoFirebase(() => {
        if (!firestore || !itemId) return null;
        return doc(firestore, 'technicalResponsibles', itemId);
    }, [firestore, itemId]);

    const { data: item, isLoading } = useDoc<TechnicalResponsible>(itemDocRef);

    const handleSuccess = () => {
      router.back();
    };

    return (
       <Dialog open={true} onOpenChange={(isOpen) => !isOpen && router.back()}>
            <DialogContent className="sm:max-w-2xl max-h-[90dvh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Editar Responsável</DialogTitle>
                    <DialogDescription>
                        Atualize os detalhes do profissional.
                    </DialogDescription>
                </DialogHeader>
                {isLoading && <div className="p-6"><Skeleton className="h-full w-full" /></div>}
                {(!item && !isLoading) && <p>Responsável não encontrado.</p>}
                {item && (
                    <ResponsibleForm
                        currentItem={item}
                        onSuccess={handleSuccess}
                        onCancel={() => router.back()}
                    />
                )}
            </DialogContent>
       </Dialog>
    );
}

export default function EditResponsibleModal() {
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
            <EditResponsibleModalContent />
        </Suspense>
    )
}
