
'use client';
import { Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { PcaForm } from '../pca-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';

function NewPcaModalContent() {
    const router = useRouter();

    const handleSuccess = () => {
      router.back();
    };
  
    return (
        <Dialog open={true} onOpenChange={(isOpen) => !isOpen && router.back()}>
            <DialogContent className="sm:max-w-7xl h-full max-h-[90dvh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Adicionar Novo PCA</DialogTitle>
                    <DialogDescription>
                        Preencha os detalhes para criar um novo Plano de Controle Ambiental.
                    </DialogDescription>
                </DialogHeader>
                <PcaForm
                    currentItem={null}
                    onSuccess={handleSuccess}
                />
            </DialogContent>
        </Dialog>
    );
}


export default function NewPcaModal() {
    return (
        <Suspense fallback={
             <Dialog open={true}>
                <DialogContent>
                    <Skeleton className="h-[500px] w-full" />
                </DialogContent>
             </Dialog>
        }>
            <NewPcaModalContent />
        </Suspense>
    )
}
