'use client';

import { useState } from 'react';
import { useFirebase, useMemoFirebase, useDoc } from '@/firebase';
import { doc } from 'firebase/firestore';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Building, Pencil } from 'lucide-react';
import type { EnvironmentalCompany } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { CompanyForm } from '../company-form';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';

export default function SettingsCompanyPage() {
  const { firestore } = useFirebase();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const companyProfileDocRef = useMemoFirebase(
    () => (firestore ? doc(firestore, 'companySettings', 'companyProfile') : null),
    [firestore]
  );
  const { data: companyProfile, isLoading, mutate } = useDoc<Omit<EnvironmentalCompany, 'id'>>(companyProfileDocRef);

  return (
    <>
      <div className="flex flex-col h-full">
        <PageHeader title="Informações da Empresa" />
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <div className="max-w-4xl mx-auto">
            <Card>
              <CardHeader className="flex flex-row items-start justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Building className="w-5 h-5" />
                    <span>Informações da Empresa (Contratado)</span>
                  </CardTitle>
                  <CardDescription>
                    Estes dados serão usados para preencher os campos de &quot;Contratado&quot; nos contratos.
                  </CardDescription>
                </div>
                <Button variant="outline" onClick={() => setIsDialogOpen(true)}>
                  <Pencil className="w-4 h-4 mr-2" />
                  Editar
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {isLoading ? (
                  <Skeleton className="h-24 w-full" />
                ) : companyProfile ? (
                  <div className="text-sm space-y-1 text-muted-foreground">
                    <p>
                      <span className="font-semibold text-foreground">Razão Social:</span> {companyProfile.name}
                    </p>
                    <p>
                      <span className="font-semibold text-foreground">CNPJ:</span> {companyProfile.cnpj}
                    </p>
                    <p>
                      <span className="font-semibold text-foreground">Endereço:</span> {companyProfile.address},{' '}
                      {companyProfile.numero}
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Nenhuma empresa cadastrada. Clique em &quot;Editar&quot; para adicionar.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-3xl flex flex-col h-full max-h-[95vh]">
          <CompanyForm
            currentItem={companyProfile}
            onSuccess={() => {
              setIsDialogOpen(false);
              mutate();
            }}
            onCancel={() => setIsDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
