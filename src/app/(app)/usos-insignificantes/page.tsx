'use client';
import { useState } from 'react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronDown, PlusCircle } from 'lucide-react';

type UsoInsignificanteType = 
    | "Poço Tubular"
    | "Captação Superficial"
    | "Captação Em Barramento"
    | "Barramento Sem Captação"
    | "Captação em Nascente"
    | "Captação em Cisterna";

const tiposDeUso: { type: UsoInsignificanteType, label: string }[] = [
    { type: 'Poço Tubular', label: 'Poço Tubular' },
    { type: 'Captação Superficial', label: 'Captação Superficial' },
    { type: 'Captação Em Barramento', label: 'Captação Em Barramento' },
    { type: 'Barramento Sem Captação', label: 'Barramento Sem Captação' },
    { type: 'Captação em Nascente', label: 'Captação em Nascente' },
    { type: 'Captação em Cisterna', label: 'Captação em Cisterna' },
];

export default function UsosInsignificantesPage() {
  const handleAddNew = (type: UsoInsignificanteType) => {
    // A lógica para abrir o formulário será adicionada aqui
    alert(`Abrir formulário para: ${type}`);
  };

  return (
    <div className="flex flex-col h-full">
      <PageHeader title="Usos Insignificantes de Água">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
              <Button size="sm" className="gap-1">
                <PlusCircle className="h-4 w-4" />
                Adicionar Uso
                <ChevronDown className="h-4 w-4" />
              </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
              <DropdownMenuLabel>Selecione o tipo de uso</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {tiposDeUso.map(({type, label}) => (
                  <DropdownMenuItem key={type} onClick={() => handleAddNew(type)}>
                      {label}
                  </DropdownMenuItem>
              ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </PageHeader>
      <main className="flex-1 overflow-auto p-4 md:p-6">
        <Card>
          <CardHeader>
            <CardTitle>Gerenciamento de Usos Insignificantes</CardTitle>
            <CardDescription>Acompanhe e cadastre todos os usos insignificantes de recursos hídricos.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-48 border-2 border-dashed rounded-lg">
                <p className="text-muted-foreground">Nenhum registro encontrado. Adicione um novo uso para começar.</p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
