
'use client';
import { Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { PradaForm } from '../prada-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';

function NewPradaModalContent() {
    const router = useRouter();

    const handleSuccess = () => {
      router.back();
    };
  
    return (
        <Dialog open={true} onOpenChange={(isOpen) => !isOpen && router.back()}>
            <DialogContent className="sm:max-w-7xl h-full max-h-[90dvh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Adicionar Novo PRADA</DialogTitle>
                    <DialogDescription>
                        Preencha os detalhes para criar um novo Plano de Recuperação de Áreas Degradadas.
                    </DialogDescription>
                </DialogHeader>
                <PradaForm
                    currentItem={null}
                    onSuccess={handleSuccess}
                />
            </DialogContent>
        </Dialog>
    );
}


export default function NewPradaModal() {
    return (
        <Suspense fallback={
             <Dialog open={true}>
                <DialogContent>
                    <Skeleton className="h-[500px] w-full" />
                </DialogContent>
             </Dialog>
        }>
            <NewPradaModalContent />
        </Suspense>
    )
}
