
'use client';
import { Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { PtrfForm } from '../ptrf-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';

function NewPtrfModalContent() {
    const router = useRouter();

    const handleSuccess = () => {
      router.back();
    };
  
    return (
        <Dialog open={true} onOpenChange={(isOpen) => !isOpen && router.back()}>
            <DialogContent className="sm:max-w-4xl h-full max-h-[90dvh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Adicionar Novo PTRF</DialogTitle>
                    <DialogDescription>
                        Preencha os detalhes para criar um novo Projeto Técnico de Recomposição de Flora.
                    </DialogDescription>
                </DialogHeader>
                <PtrfForm
                    currentItem={null}
                    onSuccess={handleSuccess}
                />
            </DialogContent>
        </Dialog>
    );
}


export default function NewPtrfModal() {
    return (
        <Suspense fallback={
             <Dialog open={true}>
                <DialogContent>
                    <Skeleton className="h-[500px] w-full" />
                </DialogContent>
             </Dialog>
        }>
            <NewPtrfModalContent />
        </Suspense>
    )
}
