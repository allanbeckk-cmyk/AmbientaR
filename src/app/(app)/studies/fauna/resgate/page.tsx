'use client';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ResgateForm } from './resgate-form';

export default function ResgateFaunaPage() {
  
  return (
    <div className="flex flex-col h-full">
      <PageHeader title="Projeto de Resgate e Destinação de Fauna" />
      <main className="flex-1 overflow-auto p-4 md:p-6">
        <Card>
          <CardHeader>
            <CardTitle>Formulário de Projeto Técnico</CardTitle>
            <CardDescription>
              Preencha os campos para gerar o projeto de resgate e destinação de fauna.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResgateForm />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
