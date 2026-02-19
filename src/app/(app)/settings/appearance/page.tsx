
'use client';

import { PageHeader } from '@/components/page-header';
import { AppearanceForm } from '../appearance-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function AppearancePage() {
  return (
    <div className="flex flex-col h-full">
      <PageHeader title="Aparência" />
      <main className="flex-1 overflow-auto p-4 md:p-6">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
                <CardTitle>Aparência</CardTitle>
                <CardDescription>
                    Personalize a aparência do aplicativo. Altere o tema para claro, escuro ou sincronize com seu sistema.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <AppearanceForm />
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
