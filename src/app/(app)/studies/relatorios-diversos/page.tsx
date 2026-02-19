
'use client';
import * as React from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PlusCircle } from 'lucide-react';

export default function RelatoriosDiversosPage() {
  const router = useRouter();

  const handleAddNew = (reportType: string) => {
    if (reportType === 'carvao-vegetal') {
      router.push('/studies/relatorios-diversos/carvao-vegetal');
    }
    if (reportType === 'transporte-residuos') {
      router.push('/studies/relatorios-diversos/transporte-residuos');
    }
  };

  return (
    <div className="flex flex-col h-full">
      <PageHeader title="Relatórios Diversos" />
      <main className="flex-1 overflow-auto p-4 md:p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Performance da Produção de Carvão Vegetal</CardTitle>
              <CardDescription>
                Relatório para acompanhar o rendimento e eficiência da produção de carvão vegetal de floresta plantada.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" onClick={() => handleAddNew('carvao-vegetal')}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Novo Relatório
              </Button>
            </CardContent>
          </Card>
           <Card>
            <CardHeader>
              <CardTitle>Transporte de Resíduos Perigosos</CardTitle>
              <CardDescription>
                Relatório descritivo para atividade de transporte de produtos e resíduos perigosos (LAS - Cadastro).
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" onClick={() => handleAddNew('transporte-residuos')}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Novo Relatório
              </Button>
            </CardContent>
          </Card>
          
          {/* Outros cards de relatórios diversos podem ser adicionados aqui no futuro */}

        </div>
      </main>
    </div>
  );
}
