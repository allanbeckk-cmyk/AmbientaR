
'use client';
import { Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { OutorgaForm } from '../outorga-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';

function NewOutorgaModalContent() {
    const router = useRouter();

    const handleSuccess = () => {
      router.back();
    };
  
    return (
        <Dialog open={true} onOpenChange={(isOpen) => !isOpen && router.back()}>
            <DialogContent className="sm:max-w-2xl h-full max-h-[90dvh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Adicionar Nova Outorga</DialogTitle>
                    <DialogDescription>
                        Preencha os detalhes para criar uma nova outorga.
                    </DialogDescription>
                </DialogHeader>
                <OutorgaForm
                    currentItem={null}
                    onSuccess={handleSuccess}
                />
            </DialogContent>
        </Dialog>
    );
}


export default function NewOutorgaModal() {
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
            <NewOutorgaModalContent />
        </Suspense>
    )
}
