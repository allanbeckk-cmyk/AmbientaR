
'use client';
import { Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { ResponsibleForm } from '../responsible-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';

function NewResponsibleModalContent() {
    const router = useRouter();

    const handleSuccess = () => {
      router.back();
    };
  
    return (
        <Dialog open={true} onOpenChange={(isOpen) => !isOpen && router.back()}>
            <DialogContent className="sm:max-w-2xl max-h-[90dvh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Adicionar Novo Responsável</DialogTitle>
                    <DialogDescription>
                        Preencha os detalhes do novo profissional.
                    </DialogDescription>
                </DialogHeader>
                <ResponsibleForm
                    currentItem={null}
                    onSuccess={handleSuccess}
                    onCancel={() => router.back()}
                />
            </DialogContent>
        </Dialog>
    );
}

export default function NewResponsibleModal() {
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
            <NewResponsibleModalContent />
        </Suspense>
    )
}
