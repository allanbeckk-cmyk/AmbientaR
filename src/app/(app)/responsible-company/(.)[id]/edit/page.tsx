
'use client';
import { Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { CompanyForm } from '../../company-form';
import { useDoc, useFirebase, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { EnvironmentalCompany } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

function EditCompanyModalContent() {
    const router = useRouter();
    const params = useParams();
    const itemId = params.id as string;
    
    const { firestore } = useFirebase();

    const itemDocRef = useMemoFirebase(() => {
        if (!firestore || !itemId) return null;
        return doc(firestore, 'environmentalCompanies', itemId);
    }, [firestore, itemId]);

    const { data: item, isLoading } = useDoc<EnvironmentalCompany>(itemDocRef);

    const handleSuccess = () => {
      router.back();
    };

    return (
       <Dialog open={true} onOpenChange={(isOpen) => !isOpen && router.back()}>
            <DialogContent className="sm:max-w-3xl h-full max-h-[95vh] flex flex-col">
                {isLoading && <Skeleton className="h-full w-full" />}
                {(!item && !isLoading) && <p>Empresa não encontrada.</p>}
                {item && (
                    <CompanyForm
                        currentItem={item}
                        onSuccess={handleSuccess}
                        onCancel={() => router.back()}
                    />
                )}
            </DialogContent>
       </Dialog>
    );
}

export default function EditCompanyModal() {
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
            <EditCompanyModalContent />
        </Suspense>
    )
}
