
'use client';

import * as React from 'react';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { InspectionForm } from '../inspection-form';
import { useRouter } from 'next/navigation';

export default function NewInspectionPage() {
    const router = useRouter();

    const handleSuccess = () => {
        router.push('/inspections');
    };

    return (
        <div className="flex flex-col h-full">
            <PageHeader title="Nova Vistoria" />
            <main className="flex-1 overflow-auto p-4 md:p-6">
                <div className="max-w-2xl mx-auto">
                    <Card>
                    <CardHeader>
                        <CardTitle>Registrar Nova Vistoria</CardTitle>
                        <CardDescription>
                        Preencha o formulário abaixo para registrar uma nova fiscalização ou vistoria de campo.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <InspectionForm onSuccess={handleSuccess} />
                    </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    );
}
