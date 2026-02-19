
'use client';
import { Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { EiaRimaForm } from '../eia-rima-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';

function NewEiaRimaModalContent() {
    const router = useRouter();

    const handleSuccess = () => {
      router.back();
    };
  
    return (
        <Dialog open={true} onOpenChange={(isOpen) => !isOpen && router.back()}>
            <DialogContent className="sm:max-w-4xl h-full max-h-[90dvh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Adicionar Novo EIA/RIMA</DialogTitle>
                    <DialogDescription>
                        Preencha os detalhes para criar um novo Estudo de Impacto Ambiental.
                    </DialogDescription>
                </DialogHeader>
                <EiaRimaForm
                    currentItem={null}
                    onSuccess={handleSuccess}
                />
            </DialogContent>
        </Dialog>
    );
}


export default function NewEiaRimaModal() {
    return (
        <Suspense fallback={
             <Dialog open={true}>
                <DialogContent>
                    <Skeleton className="h-[500px] w-full" />
                </DialogContent>
             </Dialog>
        }>
            <NewEiaRimaModalContent />
        </Suspense>
    )
}
