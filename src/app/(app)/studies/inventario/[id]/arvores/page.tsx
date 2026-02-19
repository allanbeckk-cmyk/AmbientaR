'use client';

import * as React from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Book,
  Camera,
  ChevronDown,
  Filter,
  Plus,
  Search,
  Settings,
  Trash,
} from 'lucide-react';
import { useDoc, useFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { InventoryProject } from '@/lib/types';

export default function ArvoresPage() {
  const params = useParams();
  const projectId = params.id as string;
  const { firestore } = useFirebase();

  const projectDocRef = React.useMemo(() => {
    if (!firestore || !projectId) return null;
    return doc(firestore, 'inventories', projectId);
  }, [firestore, projectId]);

  const { data: project } = useDoc<InventoryProject>(projectDocRef);

  return (
    <>
      <header className="flex h-16 items-center justify-between border-b bg-background px-6">
        <div className="flex items-center gap-4">
            <h1 className="text-xl font-semibold">{project?.nome || 'Carregando...'} &gt; Árvores</h1>
        </div>
        <div className="flex items-center gap-2">
            <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Buscar..." className="pl-9" />
            </div>
            <Button>Buscar</Button>
        </div>
      </header>
      <div className="border-b p-2">
        <div className="flex items-center gap-2">
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">Parcela: <ChevronDown className="ml-2 h-4 w-4"/></Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                    <DropdownMenuItem>Todas as Parcelas</DropdownMenuItem>
                    {/* Parcelas seriam listadas aqui */}
                </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="outline" size="sm"><Plus className="mr-2 h-4 w-4"/>Inserir</Button>
            <Button variant="outline" size="sm"><Trash className="mr-2 h-4 w-4"/>Excluir</Button>
            <Button variant="outline" size="sm"><Book className="mr-2 h-4 w-4"/>Atributos</Button>
            <Button variant="outline" size="sm"><Book className="mr-2 h-4 w-4"/>Aulas</Button>
            <Button variant="outline" size="sm"><Settings className="mr-2 h-4 w-4"/>Configurar</Button>
            <Button variant="outline" size="sm"><Camera className="mr-2 h-4 w-4"/>Fotos</Button>
            <Button variant="outline" size="sm"><Filter className="mr-2 h-4 w-4"/>Colunas</Button>
        </div>
      </div>
      <main className="flex-1 overflow-auto">
        <div className="relative">
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead className="w-[60px]">Fotos?</TableHead>
                    <TableHead>Parcela</TableHead>
                    <TableHead>N° Fuste</TableHead>
                    <TableHead>N° Árvo...</TableHead>
                    <TableHead>Código...</TableHead>
                    <TableHead>Nome Científico</TableHead>
                    <TableHead>Nome Comum</TableHead>
                    <TableHead>Família</TableHead>
                    <TableHead>CAP</TableHead>
                    <TableHead>DAP</TableHead>
                    <TableHead>Alt. Total</TableHead>
                    <TableHead>Comer...</TableHead>
                    <TableHead>Comp. Copa</TableHead>
                    <TableHead>QF</TableHead>
                    <TableHead>X</TableHead>
                    <TableHead>Y</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                    <TableRow>
                        <TableCell colSpan={16} className="h-48 text-center">
                            Nenhuma árvore foi cadastrada.
                        </TableCell>
                    </TableRow>
                </TableBody>
            </Table>
        </div>
      </main>
      <footer className="flex items-center justify-end gap-6 p-2 border-t text-sm text-muted-foreground">
        <span>Número total de fustes: 0</span>
      </footer>
    </>
  );
}
