
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
import { MoreHorizontal, PlusCircle, Pencil, Trash2, Eye, CheckCircle } from 'lucide-react';
import { useCollection, useFirebase, useMemoFirebase, errorEmitter } from '@/firebase';
import { collection, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import type { PCA, AppUser } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { FirestorePermissionError } from '@/firebase/errors';
import { useAuth } from '@/firebase';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';

const DetailItem = ({ label, value }: { label: string, value?: string | null }) => (
    <div className="space-y-1">
        <Label className="text-sm font-medium">{label}</Label>
        <p className="text-sm text-muted-foreground">{value || 'Não informado'}</p>
    </div>
);


export default function PcaPage() {
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [itemToView, setItemToView] = useState<PCA | null>(null);
  const router = useRouter();

  const { firestore, user } = useFirebase();
  const { toast } = useToast();

  const pcasQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return collection(firestore, 'pcas');
  }, [firestore, user]);

  const { data: pcas, isLoading } = useCollection<PCA>(pcasQuery);

  const { draftPcas, approvedPcas } = useMemo(() => {
    if (!pcas) return { draftPcas: [], approvedPcas: [] };
    const drafts = pcas.filter(p => p.status !== 'Aprovado');
    const approved = pcas.filter(p => p.status === 'Aprovado');
    return { draftPcas: drafts, approvedPcas: approved };
  }, [pcas]);


  const handleAddNew = () => {
    router.push('/studies/pca/new');
  };

  const handleEdit = (item: PCA) => {
    router.push(`/studies/pca/${item.id}/edit`);
  };

  const handleView = (item: PCA) => {
    setItemToView(item);
    setIsViewOpen(true);
  };

  const handleApprove = async (pcaId: string) => {
    if (!firestore) return;
    const docRef = doc(firestore, 'pcas', pcaId);
    try {
        await updateDoc(docRef, { status: 'Aprovado' });
        toast({ title: "PCA Aprovado", description: "O relatório foi movido para a lista de aprovados." });
    } catch (error) {
        console.error("Error approving PCA:", error);
        toast({ variant: "destructive", title: "Erro ao Aprovar", description: "Não foi possível atualizar o status do PCA." });
    }
  }


  const openDeleteConfirm = (itemId: string) => {
    setItemToDelete(itemId);
    setIsAlertOpen(true);
  };

  const handleDelete = () => {
    if (!firestore || !itemToDelete) return;
    const docRef = doc(firestore, 'pcas', itemToDelete);
    deleteDoc(docRef)
      .then(() => {
        toast({
          title: 'PCA deletado',
          description: 'O relatório foi removido com sucesso.',
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

  const canDelete = (item: PCA) => {
    if(!user) return false;
    if (user.role === 'admin') return true;
    if (item.status === 'Rascunho') return true;
    return false;
  }

  return (
    <>
      <div className="flex flex-col h-full">
        <PageHeader title="Planos de Controle Ambiental (PCA)">
          <Button size="sm" className="gap-1" onClick={handleAddNew}>
            <PlusCircle className="h-4 w-4" />
            Adicionar PCA
          </Button>
        </PageHeader>
        <main className="flex-1 overflow-auto p-4 md:p-6 space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>PCAs em Elaboração</CardTitle>
              <CardDescription>Acompanhe, adicione e edite os relatórios PCA em elaboração.</CardDescription>
            </CardHeader>
            <CardContent>
              <TooltipProvider>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Empreendimento</TableHead>
                      <TableHead className="hidden md:table-cell">Empreendedor</TableHead>
                      <TableHead className="hidden lg:table-cell">Processo</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading &&
                      Array.from({ length: 2 }).map((_, i) => (
                        <TableRow key={i}>
                          <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                          <TableCell className="hidden md:table-cell"><Skeleton className="h-5 w-32" /></TableCell>
                          <TableCell className="hidden lg:table-cell"><Skeleton className="h-5 w-24" /></TableCell>
                          <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                          <TableCell className="text-right"><Skeleton className="h-8 w-32" /></TableCell>
                        </TableRow>
                      ))}
                    {!isLoading && draftPcas.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.empreendimento?.nome}</TableCell>
                        <TableCell className="hidden md:table-cell text-muted-foreground">{item.empreendedor?.nome}</TableCell>
                        <TableCell className="hidden lg:table-cell text-muted-foreground">{item.termoReferencia?.processo}</TableCell>
                        <TableCell>
                          <Badge variant={item.status === 'Aprovado' ? 'default' : 'secondary'} className={cn(item.status === 'Aprovado' && 'bg-green-500/20 text-green-700')}>
                            {item.status || 'Rascunho'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" onClick={() => handleView(item)}><Eye className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent><p>Visualizar detalhes</p></TooltipContent></Tooltip>
                            <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" onClick={() => handleEdit(item)}><Pencil className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent><p>Editar PCA</p></TooltipContent></Tooltip>
                            <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" onClick={() => handleApprove(item.id)}><CheckCircle className="h-4 w-4 text-green-500" /></Button></TooltipTrigger><TooltipContent><p>Aprovar PCA</p></TooltipContent></Tooltip>
                            <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => openDeleteConfirm(item.id)} disabled={!canDelete(item)}><Trash2 className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent><p>Deletar PCA</p></TooltipContent></Tooltip>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {!isLoading && draftPcas.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center">
                          Nenhum PCA em elaboração.
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
              <CardTitle>PCAs Aprovados</CardTitle>
              <CardDescription>Lista de Planos de Controle Ambiental que foram finalizados e aprovados.</CardDescription>
            </CardHeader>
            <CardContent>
              <TooltipProvider>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Empreendimento</TableHead>
                      <TableHead className="hidden md:table-cell">Empreendedor</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading &&
                      Array.from({ length: 1 }).map((_, i) => (
                        <TableRow key={i}>
                          <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                          <TableCell className="hidden md:table-cell"><Skeleton className="h-5 w-32" /></TableCell>
                          <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                          <TableCell className="text-right"><Skeleton className="h-8 w-24" /></TableCell>
                        </TableRow>
                      ))}
                    {!isLoading && approvedPcas.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.empreendimento.nome}</TableCell>
                        <TableCell className="hidden md:table-cell text-muted-foreground">{item.empreendedor.nome}</TableCell>
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
                                        <TooltipContent><p>Deletar PCA</p></TooltipContent>
                                    </Tooltip>
                                )}
                            </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {!isLoading && approvedPcas.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="h-24 text-center">
                          Nenhum PCA aprovado.
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
            <DialogDescription>Detalhes do Plano de Controle Ambiental.</DialogDescription>
          </DialogHeader>
          {itemToView && (
            <div className="max-h-[60vh] overflow-y-auto pr-4 space-y-4">
              <DetailItem label="Empreendedor" value={itemToView.empreendedor.nome} />
              <DetailItem label="Empreendimento" value={itemToView.empreendimento.nome} />
              <Separator />
              <h4 className="font-semibold text-foreground">Termo de Referência</h4>
              <DetailItem label="Título" value={itemToView.termoReferencia.titulo} />
              <DetailItem label="Processo" value={itemToView.termoReferencia.processo} />
              <Separator />
              <h4 className="font-semibold text-foreground">Objeto do Estudo</h4>
              <DetailItem label="Objeto" value={itemToView.objetoEstudo.objeto} />
              <DetailItem label="Fundamentação Legal" value={itemToView.objetoEstudo.fundamentacaoLegal} />
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
              Esta ação não pode ser desfeita. Isso irá deletar permanentemente o relatório.
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
