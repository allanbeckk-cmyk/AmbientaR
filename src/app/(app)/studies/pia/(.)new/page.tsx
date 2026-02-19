
'use client';
import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { PiaForm } from '../pia-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import type { PiaType } from '@/lib/types';

function NewPiaModalContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const piaType = searchParams.get('type') as PiaType | null;

    const handleSuccess = () => {
      router.back();
    };
  
    return (
        <Dialog open={true} onOpenChange={(isOpen) => !isOpen && router.back()}>
            <DialogContent className="sm:max-w-7xl h-full max-h-[90dvh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Adicionar Novo PIA ({piaType || 'Tipo não selecionado'})</DialogTitle>
                    <DialogDescription>
                        Preencha os detalhes para criar um novo Plano de Intervenção Ambiental.
                    </DialogDescription>
                </DialogHeader>
                <PiaForm
                    currentItem={null}
                    piaType={piaType}
                    onSuccess={handleSuccess}
                />
            </DialogContent>
        </Dialog>
    );
}


export default function NewPiaModal() {
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
            <NewPiaModalContent />
        </Suspense>
    )
}
