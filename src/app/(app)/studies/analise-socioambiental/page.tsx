'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, PlusCircle, Pencil, Trash2, Eye, UserPlus, FileText, Link2 } from 'lucide-react';
import { useCollection, useFirebase, useMemoFirebase, errorEmitter } from '@/firebase';
import { collection, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import type { AnaliseSocioambiental } from '@/lib/types/analise-socioambiental';
import type { Client } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { FirestorePermissionError } from '@/firebase/errors';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { AnaliseSocioambientalForm } from './analise-socioambiental-form';
import { PreencherClienteDialog } from './preencher-cliente-dialog';

export default function AnaliseSocioambientalPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [preencherClienteOpen, setPreencherClienteOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<AnaliseSocioambiental | null>(null);
  const [viewingItem, setViewingItem] = useState<AnaliseSocioambiental | null>(null);
  const [analiseParaPreencher, setAnaliseParaPreencher] = useState<AnaliseSocioambiental | null>(null);
  const router = useRouter();

  const { firestore, user } = useFirebase();
  const { toast } = useToast();

  const analisesQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return collection(firestore, 'analisesSocioambientais');
  }, [firestore, user]);

  const { data: analises, isLoading } = useCollection<AnaliseSocioambiental>(analisesQuery);
  const clientsQuery = useMemoFirebase(() => (firestore ? collection(firestore, 'clients') : null), [firestore]);
  const { data: clients } = useCollection<Client>(clientsQuery);
  const clientsMap = useMemo(() => new Map(clients?.map((c) => [c.id, c])), [clients]);

  const handleAddNew = () => {
    setEditingItem(null);
    setIsFormOpen(true);
  };

  const handleEdit = (item: AnaliseSocioambiental) => {
    setEditingItem(item);
    setIsFormOpen(true);
  };

  const handleView = (item: AnaliseSocioambiental) => {
    setViewingItem(item);
    setIsViewOpen(true);
  };

  const handlePreencherCliente = (item: AnaliseSocioambiental) => {
    setAnaliseParaPreencher(item);
    setPreencherClienteOpen(true);
  };

  const openDeleteConfirm = (id: string) => {
    setItemToDelete(id);
    setIsAlertOpen(true);
  };

  const handleDelete = () => {
    if (!firestore || !itemToDelete) return;
    const docRef = doc(firestore, 'analisesSocioambientais', itemToDelete);
    deleteDoc(docRef)
      .then(() => {
        toast({ title: 'Análise removida', description: 'O extrato foi excluído.' });
      })
      .catch(() => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({ path: docRef.path, operation: 'delete' }));
      })
      .finally(() => {
        setIsAlertOpen(false);
        setItemToDelete(null);
      });
  };

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    setEditingItem(null);
  };

  const handlePreencherClienteClose = () => {
    setPreencherClienteOpen(false);
    setAnaliseParaPreencher(null);
  };

  const sortedAnalises = useMemo(() => {
    if (!analises) return [];
    return [...analises].sort((a, b) => (b.dataEmissao || '').localeCompare(a.dataEmissao || ''));
  }, [analises]);

  return (
    <div className="flex flex-col h-full">
      <PageHeader title="Análise Socioambiental">
        <Button size="sm" className="gap-1" onClick={handleAddNew}>
          <PlusCircle className="h-4 w-4" />
          Nova Análise
        </Button>
      </PageHeader>
      <main className="flex-1 overflow-auto p-4 md:p-6">
        <Card>
          <CardHeader>
            <CardTitle>Extratos de Análise Socioambiental</CardTitle>
            <CardDescription>
              Cadastre extratos (ex.: Sicoob/AgroTools) para gerar relatórios similares, preencher automaticamente o cadastro do cliente e reutilizar dados em estudos.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TooltipProvider>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Título / Propriedade</TableHead>
                    <TableHead className="hidden md:table-cell">Cliente</TableHead>
                    <TableHead className="hidden md:table-cell">Município</TableHead>
                    <TableHead>Emissão</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading &&
                    Array.from({ length: 4 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                        <TableCell className="hidden md:table-cell"><Skeleton className="h-5 w-28" /></TableCell>
                        <TableCell className="hidden md:table-cell"><Skeleton className="h-5 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                        <TableCell className="text-right"><Skeleton className="h-8 w-28 ml-auto" /></TableCell>
                      </TableRow>
                    ))}
                  {!isLoading &&
                    sortedAnalises.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.titulo || 'Sem título'}</TableCell>
                        <TableCell className="hidden md:table-cell text-muted-foreground">
                          {item.clientId ? clientsMap.get(item.clientId)?.name || '—' : '—'}
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-muted-foreground">
                          {item.informacoesPropriedade?.municipio || '—'}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {item.dataEmissao ? new Date(item.dataEmissao).toLocaleDateString('pt-BR') : '—'}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-1">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" onClick={() => handleView(item)}>
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Visualizar</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" onClick={() => handleEdit(item)}>
                                  <Pencil className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Editar</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" onClick={() => handlePreencherCliente(item)}>
                                  <UserPlus className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Preencher cadastro do cliente</TooltipContent>
                            </Tooltip>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Mais ações</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => router.push(`/studies/assistant?analiseId=${item.id}`)}>
                                  <Link2 className="mr-2 h-4 w-4" />
                                  Usar em estudo (Assistente IA)
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-destructive" onClick={() => openDeleteConfirm(item.id)}>
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Excluir
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  {!isLoading && sortedAnalises.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                        Nenhum extrato cadastrado. Clique em &quot;Nova Análise&quot; para cadastrar.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TooltipProvider>
          </CardContent>
        </Card>
      </main>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-3xl max-h-[90dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Editar Análise Socioambiental' : 'Nova Análise Socioambiental'}</DialogTitle>
            <DialogDescription>Preencha os dados do extrato (propriedade, agente, CAR, etc.) para gerar relatórios e preencher o cadastro do cliente.</DialogDescription>
          </DialogHeader>
          <AnaliseSocioambientalForm
            currentItem={editingItem}
            clients={clients ?? []}
            onSuccess={handleFormSuccess}
            onCancel={() => setIsFormOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{viewingItem?.titulo || 'Detalhes da Análise'}</DialogTitle>
            <DialogDescription>Extrato de Análise Socioambiental</DialogDescription>
          </DialogHeader>
          {viewingItem && (
            <div className="space-y-4 text-sm">
              <p><strong>Município:</strong> {viewingItem.informacoesPropriedade?.municipio ?? '—'}</p>
              <p><strong>Bioma:</strong> {viewingItem.informacoesPropriedade?.bioma ?? '—'}</p>
              <p><strong>Área informada:</strong> {viewingItem.informacoesPropriedade?.areaInformadaHa != null ? `${viewingItem.informacoesPropriedade.areaInformadaHa} ha` : '—'}</p>
              <p><strong>Status CAR:</strong> {viewingItem.informacoesPropriedade?.statusCAR ?? '—'}</p>
              {viewingItem.agentes?.length > 0 && (
                <p><strong>Agente:</strong> {viewingItem.agentes[0].nome} ({viewingItem.agentes[0].documento})</p>
              )}
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Fechar</Button>
                </DialogClose>
                <Button onClick={() => { handleEdit(viewingItem); setIsViewOpen(false); }}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Editar
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <PreencherClienteDialog
        analise={analiseParaPreencher}
        open={preencherClienteOpen}
        onClose={handlePreencherClienteClose}
        clients={clients ?? []}
      />

      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir análise?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O extrato será removido permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
