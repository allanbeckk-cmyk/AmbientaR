
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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, PlusCircle, ChevronDown, Pencil, Trash2, Eye, CheckCircle } from 'lucide-react';
import { useCollection, useFirebase, useMemoFirebase, errorEmitter } from '@/firebase';
import { collection, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import type { PIA, PiaType, AppUser } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { FirestorePermissionError } from '@/firebase/errors';
import { useAuth } from '@/firebase';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';


const piaTypes: { type: PiaType, label: string }[] = [
  { type: 'Simplificado', label: 'PIA Simplificado' },
  { type: 'Corretivo', label: 'PIA Corretivo' },
  { type: 'Inventário Florestal', label: 'PIA Inventário Florestal' },
  { type: 'Censo Florestal', label: 'PIA Censo Florestal' },
];

const DetailItem = ({ label, value }: { label: string, value?: string | null }) => (
    <div className="space-y-1">
        <Label className="text-sm font-medium">{label}</Label>
        <p className="text-sm text-muted-foreground">{value || 'Não informado'}</p>
    </div>
);


export default function PiaPage() {
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [itemToView, setItemToView] = useState<PIA | null>(null);
  const router = useRouter();
  
  const { firestore, user } = useFirebase();
  const { toast } = useToast();

  const piasQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return collection(firestore, 'pias');
  }, [firestore, user]);

  const { data: pias, isLoading } = useCollection<PIA>(piasQuery);
  
  const { draftPias, approvedPias } = useMemo(() => {
    if (!pias) return { draftPias: [], approvedPias: [] };
    const drafts = pias.filter(p => p.status !== 'Aprovado');
    const approved = pias.filter(p => p.status === 'Aprovado');
    return { draftPias: drafts, approvedPias: approved };
  }, [pias]);

  const handleAddNew = (type: PiaType) => {
    router.push(`/studies/pia/new?type=${type}`);
  };

  const handleEdit = (item: PIA) => {
    router.push(`/studies/pia/${item.id}/edit`);
  };

  const handleView = (item: PIA) => {
    setItemToView(item);
    setIsViewOpen(true);
  };
  
  const handleApprove = async (piaId: string) => {
    if (!firestore) return;
    const docRef = doc(firestore, 'pias', piaId);
    try {
        await updateDoc(docRef, { status: 'Aprovado' });
        toast({ title: "PIA Aprovado", description: "O plano foi movido para a lista de aprovados." });
    } catch (error) {
        console.error("Error approving PIA:", error);
        toast({ variant: "destructive", title: "Erro ao Aprovar", description: "Não foi possível atualizar o status do PIA." });
    }
  }


  const openDeleteConfirm = (itemId: string) => {
    setItemToDelete(itemId);
    setIsAlertOpen(true);
  };

  const handleDelete = () => {
    if (!firestore || !itemToDelete) return;
    const docRef = doc(firestore, 'pias', itemToDelete);
    deleteDoc(docRef)
      .then(() => {
        toast({
          title: 'PIA deletado',
          description: 'O formulário PIA foi removido com sucesso.',
        });
      })
      .catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
          path: docRef.path,
          operation: 'delete',
        });
        errorEmitter.emit('permission-error', permissionError);
      })
      .finally(() => {
        setIsAlertOpen(false);
        setItemToDelete(null);
      });
  };

  const canDelete = (item: PIA) => {
    if(!user) return false;
    if (user.role === 'admin') return true;
    if (item.status === 'Rascunho') return true;
    return false;
  }

  return (
    <>
      <div className="flex flex-col h-full">
        <PageHeader title="Planos de Intervenção Ambiental (PIA)">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button size="sm" className="gap-1">
                  <PlusCircle className="h-4 w-4" />
                  Novo PIA
                  <ChevronDown className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
                <DropdownMenuLabel>Selecione o tipo de PIA</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {piaTypes.map(({type, label}) => (
                    <DropdownMenuItem key={type} onClick={() => handleAddNew(type)}>
                        {label}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </PageHeader>
        <main className="flex-1 overflow-auto p-4 md:p-6 space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>PIAs em Elaboração</CardTitle>
              <CardDescription>Acompanhe, adicione e edite os formulários PIA em elaboração.</CardDescription>
            </CardHeader>
            <CardContent>
              <TooltipProvider>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Empreendimento</TableHead>
                      <TableHead className="hidden sm:table-cell">Tipo</TableHead>
                      <TableHead className="hidden md:table-cell">Requerente</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading &&
                      Array.from({ length: 2 }).map((_, i) => (
                        <TableRow key={i}>
                          <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                          <TableCell className="hidden sm:table-cell"><Skeleton className="h-5 w-24" /></TableCell>
                          <TableCell className="hidden md:table-cell"><Skeleton className="h-5 w-32" /></TableCell>
                          <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                          <TableCell className="text-right"><Skeleton className="h-8 w-32" /></TableCell>
                        </TableRow>
                      ))}
                    {!isLoading && draftPias.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.empreendimento?.nome}</TableCell>
                        <TableCell className="hidden sm:table-cell text-muted-foreground">{item.type}</TableCell>
                        <TableCell className="hidden md:table-cell text-muted-foreground">{item.requerente?.nome}</TableCell>
                         <TableCell>
                          <Badge variant={item.status === 'Aprovado' ? 'default' : 'secondary'} className={cn(item.status === 'Aprovado' && 'bg-green-500/20 text-green-700')}>
                            {item.status || 'Rascunho'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" onClick={() => handleView(item)}><Eye className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent><p>Visualizar detalhes</p></TooltipContent></Tooltip>
                            <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" onClick={() => handleEdit(item)}><Pencil className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent><p>Editar PIA</p></TooltipContent></Tooltip>
                            <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" onClick={() => handleApprove(item.id)}><CheckCircle className="h-4 w-4 text-green-500" /></Button></TooltipTrigger><TooltipContent><p>Aprovar PIA</p></TooltipContent></Tooltip>
                            <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => openDeleteConfirm(item.id)} disabled={!canDelete(item)}><Trash2 className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent><p>Deletar PIA</p></TooltipContent></Tooltip>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {!isLoading && draftPias.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center">
                          Nenhum PIA em elaboração.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TooltipProvider>
            </CardContent>
          </Card>
          
           <Card>
            <CardHeader>
              <CardTitle>PIAs Aprovados</CardTitle>
              <CardDescription>Lista de Planos de Intervenção Ambiental que foram finalizados e aprovados.</CardDescription>
            </CardHeader>
            <CardContent>
              <TooltipProvider>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Empreendimento</TableHead>
                      <TableHead className="hidden sm:table-cell">Tipo</TableHead>
                      <TableHead className="hidden md:table-cell">Requerente</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading &&
                      Array.from({ length: 1 }).map((_, i) => (
                        <TableRow key={i}>
                          <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                          <TableCell className="hidden sm:table-cell"><Skeleton className="h-5 w-24" /></TableCell>
                          <TableCell className="hidden md:table-cell"><Skeleton className="h-5 w-32" /></TableCell>
                          <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                          <TableCell className="text-right"><Skeleton className="h-8 w-24" /></TableCell>
                        </TableRow>
                      ))}
                    {!isLoading && approvedPias.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.empreendimento.nome}</TableCell>
                        <TableCell className="hidden sm:table-cell text-muted-foreground">{item.type}</TableCell>
                        <TableCell className="hidden md:table-cell text-muted-foreground">{item.requerente.nome}</TableCell>
                         <TableCell>
                           <Badge variant={'outline'} className={cn('bg-green-500/20 text-green-700')}>
                            {item.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                           <div className="flex items-center justify-end gap-1">
                                <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" onClick={() => handleView(item)}><Eye className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent><p>Visualizar detalhes</p></TooltipContent></Tooltip>
                                {user?.role === 'admin' && (
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => openDeleteConfirm(item.id)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent><p>Deletar PIA</p></TooltipContent>
                                    </Tooltip>
                                )}
                            </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {!isLoading && approvedPias.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center">
                          Nenhum PIA aprovado.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TooltipProvider>
            </CardContent>
          </Card>
        </main>
      </div>

       <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{itemToView?.empreendimento.nome}</DialogTitle>
            <DialogDescription>Detalhes do Plano de Intervenção Ambiental ({itemToView?.type}).</DialogDescription>
          </DialogHeader>
          {itemToView && (
            <div className="max-h-[60vh] overflow-y-auto pr-4 space-y-4">
              <DetailItem label="Requerente" value={itemToView.requerente.nome} />
              <DetailItem label="Empreendimento" value={itemToView.empreendimento.nome} />
              <Separator />
              <p className="text-sm text-muted-foreground">Mais detalhes em breve...</p>
            </div>
          )}
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">Fechar</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isso irá deletar permanentemente o formulário PIA.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Deletar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
