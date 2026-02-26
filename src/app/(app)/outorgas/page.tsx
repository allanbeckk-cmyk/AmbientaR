
'use client';
import { useState, useMemo, useEffect } from 'react';
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
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, PlusCircle, Paperclip, Eye, Pencil, Trash2, Download, ClipboardCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCollection, useFirestore, useUser, useMemoFirebase, errorEmitter } from '@/firebase';
import { collection, doc, deleteDoc, query, where, getDocs } from 'firebase/firestore';
import type { WaterPermit, Empreendedor, AppUser, Project } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { OutorgaForm } from './outorga-form';
import { useToast } from '@/hooks/use-toast';
import { FirestorePermissionError } from '@/firebase/errors';
import { useAuth } from '@/firebase';
import { useRouter } from 'next/navigation';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const canPerformWriteActions = (user: AppUser | null): boolean => {
    if (!user) return false;
    return user.role === 'admin' || user.role === 'gestor' || user.role === 'supervisor';
}

const DetailItem = ({ label, value }: { label: string, value?: string | null | string[] }) => (
    <div className="space-y-1">
        <Label className="text-sm font-medium">{label}</Label>
        <p className="text-sm text-muted-foreground">{Array.isArray(value) ? value.join(', ') : (value || 'Não informado')}</p>
    </div>
);


export default function OutorgasPage() {
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<WaterPermit | null>(null);
  const [viewingItem, setViewingItem] = useState<WaterPermit | null>(null);
  const [empreendedorIdsForUser, setEmpreendedorIdsForUser] = useState<string[] | undefined>(undefined);
  
  const { user } = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();
  const router = useRouter();
  
  useEffect(() => {
    if (user?.role === 'client' && firestore) {
        setEmpreendedorIdsForUser(undefined);
        const userDocuments = [user.cpf, ...(user.cnpjs || [])].filter(Boolean) as string[];
        if (userDocuments.length > 0) {
            const empreendedoresRef = collection(firestore, 'empreendedores');
            const q = query(empreendedoresRef, where('cpfCnpj', 'in', userDocuments));
            getDocs(q).then(snapshot => {
                const ids = snapshot.docs.map(doc => doc.id);
                setEmpreendedorIdsForUser(ids.length > 0 ? ids : ['invalid-placeholder']);
            }).catch(err => {
                console.error("Error fetching empreendedor IDs:", err);
                setEmpreendedorIdsForUser(['invalid-placeholder']);
            });
        } else {
            setEmpreendedorIdsForUser(['invalid-placeholder']);
        }
    } else if (user) {
        // For non-client users, we don't need to filter by empreendedor
        setEmpreendedorIdsForUser([]);
    }
  }, [user, firestore]);

  const outorgasQuery = useMemoFirebase(() => {
    if (!firestore || !user || empreendedorIdsForUser === undefined) return null;
    
    if (user.role === 'client') {
        if (empreendedorIdsForUser.length > 0) {
          return query(collection(firestore, 'outorgas'), where('empreendedorId', 'in', empreendedorIdsForUser));
        }
        return null; // Don't query if there are no empreendedorIds
    }
    
    return collection(firestore, 'outorgas');
  }, [firestore, user, empreendedorIdsForUser]);

  const { data: outorgas, isLoading: isLoadingOutorgas } = useCollection<WaterPermit>(outorgasQuery);

  const empreendedoresQuery = useMemoFirebase(() => firestore ? collection(firestore, 'empreendedores') : null, [firestore]);
  const { data: empreendedores, isLoading: isLoadingEmpreendedores } = useCollection<Empreendedor>(empreendedoresQuery);
  const empreendedoresMap = useMemo(() => new Map(empreendedores?.map(c => [c.id, c.name])), [empreendedores]);

  const projectsQuery = useMemoFirebase(() => firestore ? collection(firestore, 'projects') : null, [firestore]);
  const { data: projects, isLoading: isLoadingProjects } = useCollection<Project>(projectsQuery);
  const projectsMap = useMemo(() => new Map(projects?.map(p => [p.id, p.propertyName])), [projects]);

  const isLoading = isLoadingOutorgas || isLoadingEmpreendedores || isLoadingProjects || (user?.role === 'client' && empreendedorIdsForUser === undefined);


  const handleAddNew = () => {
    router.push('/outorgas/new');
  };

  const handleEdit = (item: WaterPermit) => {
    router.push(`/outorgas/${item.id}/edit`);
  };

  const handleView = (item: WaterPermit) => {
    setViewingItem(item);
    setIsViewOpen(true);
  };

  const openDeleteConfirm = (itemId: string) => {
    setItemToDelete(itemId);
    setIsAlertOpen(true);
  };

  const handleDelete = () => {
    if (!firestore || !itemToDelete) return;
    const docRef = doc(firestore, 'outorgas', itemToDelete);
    deleteDoc(docRef)
      .then(() => {
        toast({
          title: 'Outorga deletada',
          description: 'A outorga foi removida com sucesso.',
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

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
  };
  
  const getStatusVariant = (status: WaterPermit['status']) => {
    switch (status) {
      case 'Válida':
        return 'bg-emerald-500/20 text-emerald-700 border-emerald-500/30';
      case 'Em Renovação':
        return 'bg-blue-500/20 text-blue-700 border-blue-500/30';
      case 'Vencida':
        return 'bg-red-500/20 text-red-700 border-red-500/30';
      case 'Suspensa':
      case 'Cancelada':
         return 'bg-yellow-500/20 text-yellow-700 border-yellow-500/30';
      default:
        return 'bg-slate-500/20 text-slate-700 border-slate-500/30';
    }
  };

  return (
    <>
      <div className="flex flex-col h-full">
        <PageHeader title="Outorgas de Uso de Água">
            {canPerformWriteActions(user) && (
                <Button size="sm" className="gap-1" onClick={handleAddNew}>
                    <PlusCircle className="h-4 w-4" />
                    Adicionar Outorga
                </Button>
            )}
        </PageHeader>
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <Card>
            <CardHeader>
              <CardTitle>Gerenciamento de Outorgas</CardTitle>
              <CardDescription>Acompanhe e gerencie todas as outorgas de uso de água dos seus clientes.</CardDescription>
            </CardHeader>
            <CardContent>
             <TooltipProvider>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Empreendedor</TableHead>
                    <TableHead>Empreendimento</TableHead>
                    <TableHead className="hidden md:table-cell">Nº da Portaria</TableHead>
                    <TableHead className="hidden lg:table-cell">Emissão</TableHead>
                    <TableHead className="hidden lg:table-cell">Vencimento</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading &&
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                        <TableCell className="hidden md:table-cell"><Skeleton className="h-5 w-24" /></TableCell>
                        <TableCell className="hidden lg:table-cell"><Skeleton className="h-5 w-24" /></TableCell>
                        <TableCell className="hidden lg:table-cell"><Skeleton className="h-5 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-24 rounded-full" /></TableCell>
                        <TableCell className="text-right"><Skeleton className="h-8 w-24" /></TableCell>
                      </TableRow>
                    ))}
                  {!isLoading && outorgas?.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{empreendedoresMap.get(item.empreendedorId) || 'Não encontrado'}</TableCell>
                      <TableCell className="font-medium">{projectsMap.get(item.projectId || '') || 'N/A'}</TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground">{item.permitNumber}</TableCell>
                      <TableCell className="hidden lg:table-cell text-muted-foreground">{formatDate(item.issueDate)}</TableCell>
                      <TableCell className="hidden lg:table-cell text-muted-foreground">{formatDate(item.expirationDate)}</TableCell>
                      <TableCell>
                        <Badge variant={'outline'} className={cn(getStatusVariant(item.status))}>
                          {item.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    {item.fileUrl ? (
                                        <Button asChild variant="ghost" size="icon">
                                            <a href={item.fileUrl} target="_blank" rel="noopener noreferrer">
                                                <Download className="h-4 w-4" />
                                                <span className="sr-only">Baixar certificado</span>
                                            </a>
                                        </Button>
                                    ) : (
                                        <Button variant="ghost" size="icon" disabled>
                                            <Download className="h-4 w-4" />
                                            <span className="sr-only">Sem certificado</span>
                                        </Button>
                                    )}
                                </TooltipTrigger>
                                <TooltipContent><p>{item.fileUrl ? 'Baixar certificado da outorga' : 'Nenhum certificado anexado'}</p></TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" onClick={() => router.push(`/compliance?outorgaId=${item.id}`)}>
                                  <ClipboardCheck className="h-4 w-4" />
                                  <span className="sr-only">Ver condicionantes</span>
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent><p>Ver condicionantes</p></TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" onClick={() => handleView(item)}>
                                  <Eye className="h-4 w-4" />
                                  <span className="sr-only">Visualizar</span>
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent><p>Visualizar detalhes</p></TooltipContent>
                            </Tooltip>
                            {canPerformWriteActions(user) && (
                              <>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                     <Button variant="ghost" size="icon" onClick={() => handleEdit(item)}>
                                        <Pencil className="h-4 w-4" />
                                        <span className="sr-only">Editar</span>
                                      </Button>
                                  </TooltipTrigger>
                                  <TooltipContent><p>Editar outorga</p></TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => openDeleteConfirm(item.id)}>
                                      <Trash2 className="h-4 w-4" />
                                      <span className="sr-only">Deletar</span>
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent><p>Deletar outorga</p></TooltipContent>
                                </Tooltip>
                              </>
                            )}
                          </div>
                      </TableCell>
                    </TableRow>
                  ))}
                   {!isLoading && outorgas?.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={8} className="h-24 text-center">
                                Nenhuma outorga encontrada.
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

      <Dialog open={isFormDialogOpen} onOpenChange={setIsFormDialogOpen}>
        <DialogContent className="sm:max-w-2xl h-full max-h-[90dvh] flex flex-col">
          <OutorgaForm
            currentItem={editingItem}
            onSuccess={() => setIsFormDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
      
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes da Outorga</DialogTitle>
            <DialogDescription>
              Visualização dos dados para a outorga #{viewingItem?.permitNumber}.
            </DialogDescription>
          </DialogHeader>
          {viewingItem && (
            <div className="space-y-4 py-4 text-sm">
                <div className="grid grid-cols-2 gap-4">
                    <DetailItem label="Empreendedor" value={empreendedoresMap.get(viewingItem.empreendedorId)} />
                    <DetailItem label="Empreendimento" value={projectsMap.get(viewingItem.projectId || '')} />
                </div>
                 <Separator />
                <div className="grid grid-cols-2 gap-4">
                    <DetailItem label="Nº da Portaria" value={viewingItem.permitNumber} />
                    <DetailItem label="Nº do Processo" value={viewingItem.processNumber} />
                </div>
                 <Separator />
                 <div className="grid grid-cols-2 gap-4">
                    <DetailItem label="Data de Emissão" value={formatDate(viewingItem.issueDate)} />
                    <DetailItem label="Data de Vencimento" value={formatDate(viewingItem.expirationDate)} />
                </div>
                <div className="space-y-1"><Label>Status</Label><div><Badge variant={'outline'} className={cn(getStatusVariant(viewingItem.status))}>{viewingItem.status}</Badge></div></div>
                 <Separator />
                <div className="space-y-1"><Label>Finalidade</Label><p className="text-muted-foreground whitespace-pre-wrap">{viewingItem.description || 'N/A'}</p></div>
                {viewingItem.fileUrl && <div className="space-y-1"><Label>Anexo</Label><p><a href={viewingItem.fileUrl} target="_blank" rel="noreferrer" className="text-primary underline flex items-center gap-2"><Paperclip className="h-4 w-4" />Ver documento</a></p></div>}
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
              Esta ação não pode ser desfeita. Isso irá deletar permanentemente o pedido de outorga.
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

