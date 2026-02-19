
'use client';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ClientForm } from '../client-form';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import type { Client } from '@/lib/types';

function NewClientPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const prefilledFromAnalise = (): Partial<Client> | null => {
      const name = searchParams.get('name');
      const cpfCnpj = searchParams.get('cpfCnpj');
      const municipio = searchParams.get('municipio');
      const uf = searchParams.get('uf');
      if (!name && !cpfCnpj && !municipio && !uf) return null;
      return { name: name ?? '', cpfCnpj: cpfCnpj ?? '', municipio: municipio ?? '', uf: uf ?? '' };
    };

    const initialClient = prefilledFromAnalise();
    const fromAnaliseId = searchParams.get('fromAnalise');

    const handleSuccess = () => {
      router.push('/clients');
    };

    const handleCancel = () => {
        router.back();
    }

    return (
      <div className="flex flex-col h-full">
        <PageHeader title="Novo Cliente" />
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <div className="max-w-4xl mx-auto">
               <Card>
                  <CardHeader>
                      <CardTitle>Adicionar Novo Cliente</CardTitle>
                      <CardDescription>
                          {initialClient ? 'Dados iniciais preenchidos a partir da Análise Socioambiental. Revise e complete o cadastro.' : 'Preencha os detalhes para criar um novo cliente.'}
                      </CardDescription>
                  </CardHeader>
                  <CardContent>
                      <ClientForm
                          currentClient={initialClient && Object.values(initialClient).some(Boolean) ? ({ id: '', ...initialClient } as Client) : null}
                          onSuccess={handleSuccess}
                          onCancel={handleCancel}
                      />
                  </CardContent>
              </Card>
          </div>
        </main>
      </div>
    );
}

export default function NewClientPage() {
    return (
        <Suspense fallback={<div>Carregando...</div>}>
            <NewClientPageContent />
        </Suspense>
    )
}
