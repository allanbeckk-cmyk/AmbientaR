
'use client';

import * as React from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Copy,
  FileDown,
  Filter,
  MoreHorizontal,
  Plus,
  Search,
  Trash,
  AlertCircle,
} from 'lucide-react';
import { useDoc, useFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { InventoryProject } from '@/lib/types';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription, DialogClose } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AtributosDialog } from './atributos-dialog';
import { ImportDialog } from '../import-dialog';
import { Alert, AlertTitle } from "@/components/ui/alert";


type ColumnVisibility = {
    codigo: boolean;
    nomeCientifico: boolean;
    nomeComum: boolean;
    familia: boolean;
}

export default function SpeciesPage() {
  const params = useParams();
  const projectId = params.id as string;
  const { firestore } = useFirebase();
  const [isImporting, setIsImporting] = React.useState(false);

  const projectDocRef = React.useMemo(() => {
    if (!firestore || !projectId) return null;
    return doc(firestore, 'inventories', projectId);
  }, [firestore, projectId]);

  const { data: project } = useDoc<InventoryProject>(projectDocRef);
  
  const [columnVisibility, setColumnVisibility] = React.useState<ColumnVisibility>({
    codigo: true,
    nomeCientifico: true,
    nomeComum: true,
    familia: true,
  });

  const toggleAllColumns = (visible: boolean) => {
    setColumnVisibility({
        codigo: visible,
        nomeCientifico: visible,
        nomeComum: visible,
        familia: visible,
    });
  };

  return (
    <>
      <header className="flex h-16 items-center justify-between border-b bg-background px-6">
        <div className="flex items-center gap-4">
            <h1 className="text-xl font-semibold">{project?.nome || 'Carregando...'} &gt; Espécies</h1>
        </div>
        <div className="flex items-center gap-2">
            <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Buscar..." className="pl-9" />
            </div>
        </div>
      </header>
      <div className="border-b p-2">
        <div className="flex items-center gap-2">
            <Dialog>
                <DialogTrigger asChild>
                    <Button variant="outline" size="sm"><Plus className="mr-2 h-4 w-4"/>Inserir</Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[525px]">
                    <DialogHeader>
                        <DialogTitle>Inserir Espécies</DialogTitle>
                        <DialogDescription>
                            Configure como as espécies serão adicionadas.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="p-4 border rounded-md space-y-4">
                        <h3 className="font-medium text-sm text-muted-foreground">Configurações de inserção</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="num-especies">Número de espécies</Label>
                                <Input id="num-especies" type="number" placeholder="Número de espécies" />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="onde-inserir">Onde Inserir</Label>
                                <Select defaultValue="depois">
                                    <SelectTrigger id="onde-inserir">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="antes">Antes da espécie selecionada</SelectItem>
                                        <SelectItem value="depois">Depois da última espécie</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <DialogClose asChild>
                           <Button variant="outline">Fechar</Button>
                        </DialogClose>
                        <Button>Adicionar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm"><Trash className="mr-2 h-4 w-4"/>Excluir</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Remover espécie</AlertDialogTitle>
                  <AlertDialogDescription>
                    <div>
                        <div className="text-sm">
                            <div className="font-semibold">Espécie que será removida:</div>
                            <div>Código: 14</div>
                            <div>Nome Científico: [Nome da espécie]</div>
                            <div>Nome Comum: [Nome comum]</div>
                        </div>
                        <Alert variant="destructive" className="mt-4">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Não existem árvores vinculadas a essa espécie</AlertTitle>
                        </Alert>
                        <div className="mt-4 space-y-2 text-muted-foreground">
                            <div className="font-semibold text-foreground">Renumerar espécies</div>
                            <div>Alterar espécie das árvores</div>
                            <div>Selecione uma nova espécie</div>
                             <div className="relative w-full">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input placeholder="Nova espécie..." className="pl-9" disabled />
                            </div>
                        </div>
                    </div>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction>Excluir</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <AtributosDialog />
            <Button variant="outline" size="sm" onClick={() => setIsImporting(true)}><FileDown className="mr-2 h-4 w-4"/>Importar</Button>
            <Button variant="outline" size="sm"><Copy className="mr-2 h-4 w-4"/>Duplicar</Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm"><Filter className="mr-2 h-4 w-4"/>Colunas</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>Ajustar Colunas</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => toggleAllColumns(true)}>Todos</DropdownMenuItem>
                <DropdownMenuItem onSelect={() => toggleAllColumns(false)}>Nenhum</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuCheckboxItem checked={columnVisibility.codigo} onCheckedChange={(checked) => setColumnVisibility(prev => ({...prev, codigo: !!checked}))}>
                    Código Espécie
                </DropdownMenuCheckboxItem>
                 <DropdownMenuCheckboxItem checked={columnVisibility.nomeCientifico} onCheckedChange={(checked) => setColumnVisibility(prev => ({...prev, nomeCientifico: !!checked}))}>
                    Nome Científico
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem checked={columnVisibility.nomeComum} onCheckedChange={(checked) => setColumnVisibility(prev => ({...prev, nomeComum: !!checked}))}>
                    Nome Comum
                </DropdownMenuCheckboxItem>
                 <DropdownMenuCheckboxItem checked={columnVisibility.familia} onCheckedChange={(checked) => setColumnVisibility(prev => ({...prev, familia: !!checked}))}>
                    Família
                </DropdownMenuCheckboxItem>
              </DropdownMenuContent>
            </DropdownMenu>
        </div>
      </div>
      <main className="flex-1 overflow-auto">
        <div className="relative">
            <Table>
                <TableHeader>
                <TableRow>
                    {columnVisibility.codigo && <TableHead>Código Esp...</TableHead>}
                    {columnVisibility.nomeCientifico && <TableHead>Nome Científico</TableHead>}
                    {columnVisibility.nomeComum && <TableHead>Nome Comum</TableHead>}
                    {columnVisibility.familia && <TableHead>Família</TableHead>}
                </TableRow>
                </TableHeader>
                <TableBody>
                    <TableRow>
                        <TableCell colSpan={Object.values(columnVisibility).filter(v => v).length} className="h-48 text-center">
                            Nenhuma espécie foi cadastrada.
                        </TableCell>
                    </TableRow>
                </TableBody>
            </Table>
        </div>
      </main>
      <footer className="flex items-center justify-end gap-6 p-2 border-t text-sm text-muted-foreground">
        <span>0 até 0 de 0</span>
        <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" className="h-8 w-8" disabled>
                <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" className="h-8 w-8" disabled>
                <ChevronLeft className="h-4 w-4" />
            </Button>
            <span>Página 0 de 0</span>
            <Button variant="outline" size="icon" className="h-8 w-8" disabled>
                <ChevronRight className="h-4 w-4" />
            </Button>
             <Button variant="outline" size="icon" className="h-8 w-8" disabled>
                <ChevronsRight className="h-4 w-4" />
            </Button>
        </div>
      </footer>

      <ImportDialog isOpen={isImporting} onOpenChange={setIsImporting} />
    </>
  );
}
