'use client';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { MonitoramentoForm } from './monitoramento-form';

export default function MonitoramentoFaunaPage() {
  
  return (
    <div className="flex flex-col h-full">
      <PageHeader title="Projeto Técnico de Monitoramento de Fauna" />
      <main className="flex-1 overflow-auto p-4 md:p-6">
        <Card>
          <CardHeader>
            <CardTitle>Formulário de Projeto Técnico</CardTitle>
            <CardDescription>
              Preencha os campos para gerar o projeto de monitoramento de fauna.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <MonitoramentoForm />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
