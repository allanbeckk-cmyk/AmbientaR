
'use client';
import { Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { CompanyForm } from '../company-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';

function NewCompanyModalContent() {
    const router = useRouter();

    const handleSuccess = () => {
      router.back();
    };
  
    return (
        <Dialog open={true} onOpenChange={(isOpen) => !isOpen && router.back()}>
            <DialogContent className="sm:max-w-3xl h-full max-h-[95vh] flex flex-col">
                 <DialogHeader>
                    <DialogTitle>Adicionar Nova Empresa Responsável</DialogTitle>
                    <DialogDescription>
                        Preencha os detalhes para cadastrar uma nova empresa.
                    </DialogDescription>
                </DialogHeader>
                <CompanyForm
                    currentItem={null}
                    onSuccess={handleSuccess}
                    onCancel={() => router.back()}
                />
            </DialogContent>
        </Dialog>
    );
}


export default function NewCompanyModal() {
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
            <NewCompanyModalContent />
        </Suspense>
    )
}
