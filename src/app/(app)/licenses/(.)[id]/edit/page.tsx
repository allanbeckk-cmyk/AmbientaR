
'use client';
import { Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { LicenseForm } from '../../license-form';
import { useDoc, useFirebase, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { License } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

function EditLicenseModalContent() {
    const router = useRouter();
    const params = useParams();
    const itemId = params.id as string;
    
    const { firestore } = useFirebase();

    const itemDocRef = useMemoFirebase(() => {
        if (!firestore || !itemId) return null;
        return doc(firestore, 'licenses', itemId);
    }, [firestore, itemId]);

    const { data: item, isLoading } = useDoc<License>(itemDocRef);

    const handleSuccess = () => {
      router.back();
    };

    return (
       <Dialog open={true} onOpenChange={(isOpen) => !isOpen && router.back()}>
            <DialogContent className="sm:max-w-2xl h-full max-h-[90dvh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Editar Licença</DialogTitle>
                    <DialogDescription>Atualize as informações da licença abaixo.</DialogDescription>
                </DialogHeader>
                {isLoading && <div className="p-6"><Skeleton className="h-[400px] w-full" /></div>}
                {(!item && !isLoading) && <div className="p-6"><p>Licença não encontrada.</p></div>}
                {item && (
                    <LicenseForm
                        currentItem={item}
                        onSuccess={handleSuccess}
                    />
                )}
            </DialogContent>
       </Dialog>
    );
}

export default function EditLicenseModal() {
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
            <EditLicenseModalContent />
        </Suspense>
    )
}
