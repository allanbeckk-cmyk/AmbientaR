
'use client';
import * as React from 'react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
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
import { MoreHorizontal, PlusCircle, ChevronDown } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function EducacaoAmbientalPage() {
  const [isLoading, setIsLoading] = React.useState(true); // Simulate loading state
  const router = useRouter();

  React.useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1500);
    return () => clearTimeout(timer);
  }, []);
  
  const handleAddNew = (action: 'elaborar' | 'dispensa' | 'relatorio') => {
    if (action === 'dispensa') {
      router.push('/studies/educacao-ambiental/solicitar-dispensa');
    } else {
      alert(`Ação: ${action} (em desenvolvimento)`);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <PageHeader title="Educação Ambiental">
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button size="sm" className="gap-1">
                    <PlusCircle className="h-4 w-4" />
                    Adicionar Programa
                    <ChevronDown className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
                <DropdownMenuLabel>Selecione uma ação</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleAddNew('elaborar')}>
                    Elaborar Programa
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleAddNew('dispensa')}>
                    Solicitar Dispensa
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleAddNew('relatorio')}>
                    Elaborar Relatório
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
      </PageHeader>
      <main className="flex-1 overflow-auto p-4 md:p-6 space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Programas em Elaboração</CardTitle>
            <CardDescription>Acompanhe, adicione e edite os programas em elaboração.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Empreendimento</TableHead>
                  <TableHead className="hidden md:table-cell">Requerente</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={4}><Skeleton className="h-10 w-full" /></TableCell>
                  </TableRow>
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">Nenhum programa em elaboração.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Programas Aprovados</CardTitle>
            <CardDescription>Lista de programas que foram finalizados e aprovados.</CardDescription>
          </CardHeader>
          <CardContent>
             <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Empreendimento</TableHead>
                  <TableHead className="hidden md:table-cell">Requerente</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                 {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={4}><Skeleton className="h-10 w-full" /></TableCell>
                  </TableRow>
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">Nenhum programa aprovado.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
