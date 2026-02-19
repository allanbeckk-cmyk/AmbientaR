'use client';

import * as React from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Plus,
  Pencil,
  Trash2,
  Replace
} from 'lucide-react';
import { useDoc, useFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { InventoryProject } from '@/lib/types';

export default function FormulasPage() {
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
            <h1 className="text-xl font-semibold">{project?.nome || 'Carregando...'} &gt; Fórmulas</h1>
        </div>
      </header>
      <div className="border-b p-2">
        <div className="flex items-center gap-2">
            <Button variant="outline" size="sm"><Plus className="mr-2 h-4 w-4"/>Inserir</Button>
            <Button variant="outline" size="sm"><Pencil className="mr-2 h-4 w-4"/>Editar</Button>
            <Button variant="outline" size="sm"><Trash2 className="mr-2 h-4 w-4"/>Excluir</Button>
            <Button variant="outline" size="sm"><Replace className="mr-2 h-4 w-4"/>Transferir</Button>
        </div>
      </div>
      <main className="flex-1 overflow-auto">
        <div className="relative">
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Expressão</TableHead>
                    <TableHead>É?</TableHead>
                    <TableHead>Dados de</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                    <TableRow>
                        <TableCell>Volume Cilíndrico (Somente exemplo)</TableCell>
                        <TableCell>PI * (D^2) * HT / 40000</TableCell>
                        <TableCell>Sim</TableCell>
                        <TableCell>04/11/2025 13:49:44</TableCell>
                    </TableRow>
                </TableBody>
            </Table>
        </div>
      </main>
    </>
  );
}
