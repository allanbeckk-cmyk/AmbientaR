
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
import { MoreHorizontal, PlusCircle, Paperclip, Eye, Pencil, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCollection, useFirestore, useUser, useMemoFirebase, errorEmitter } from '@/firebase';
import { collection, doc, deleteDoc, query, where, getDocs } from 'firebase/firestore';
import type { EnvironmentalIntervention, Empreendedor, AppUser, Project } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
import { IntervencaoForm } from './intervencao-form';
import { useToast } from '@/hooks/use-toast';
import { FirestorePermissionError } from '@/firebase/errors';
import { useAuth } from '@/firebase';
import { useRouter } from 'next/navigation';

const canPerformWriteActions = (user: AppUser | null): boolean => {
    if (!user) return false;
    return user.role === 'admin' || user.role === 'gestor' || user.role === 'supervisor';
}

export default function IntervencoesPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<EnvironmentalIntervention | null>(null);
  const [empreendedorIdsForUser, setEmpreendedorIdsForUser] = useState<string[] | undefined>(undefined);

  const { firestore, user } = useAuth();
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

  const intervencoesQuery = useMemoFirebase(() => {
    if (!firestore || !user || empreendedorIdsForUser === undefined) return null;
    if (user.role === 'client') {
        if (empreendedorIdsForUser.length > 0) {
            return query(collection(firestore, 'intervencoes'), where('empreendedorId', 'in', empreendedorIdsForUser));
        }
        // Return a query that will find no documents if no empreendedores are linked.
        return query(collection(firestore, 'intervencoes'), where('empreendedorId', 'in', ['invalid-placeholder']));
    }
    return collection(firestore, 'intervencoes');
  }, [firestore, user, empreendedorIdsForUser]);

  const { data: intervencoes, isLoading: isLoadingIntervencoes } = useCollection<EnvironmentalIntervention>(intervencoesQuery);

  const empreendedoresQuery = useMemoFirebase(() => firestore ? collection(firestore, 'empreendedores') : null, [firestore]);
  const { data: empreendedores, isLoading: isLoadingEmpreendedores } = useCollection<Empreendedor>(empreendedoresQuery);
  const empreendedoresMap = new Map(empreendedores?.map(c => [c.id, c.name]));

  const isLoading = isLoadingIntervencoes || isLoadingEmpreendedores || (user?.role === 'client' && empreendedorIdsForUser === undefined);


  const handleAddNew = () => {
    setEditingItem(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (item: EnvironmentalIntervention) => {
    setEditingItem(item);
    setIsDialogOpen(true);
  };

  const openDeleteConfirm = (itemId: string) => {
    setItemToDelete(itemId);
    setIsAlertOpen(true);
  };

  const handleDelete = () => {
    if (!firestore || !itemToDelete) return;
    const docRef = doc(firestore, 'intervencoes', itemToDelete);
    deleteDoc(docRef)
      .then(() => {
        toast({
          title: 'DAIA deletada',
          description: 'A autorização para intervenção ambiental foi removida com sucesso.',
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
  
  const getStatusVariant = (status: EnvironmentalIntervention['status']) => {
    switch (status) {
      case 'Válida':
        return 'bg-emerald-500/20 text-emerald-700 border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20';
      case 'Em Renovação':
        return 'bg-blue-500/20 text-blue-700 border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20';
      case 'Vencida':
        return 'bg-red-500/20 text-red-700 border-red-500/30 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20';
      case 'Suspensa':
      case 'Cancelada':
         return 'bg-yellow-500/20 text-yellow-700 border-yellow-500/30 dark:bg-yellow-500/10 dark:text-yellow-400 dark:border-yellow-500/20';
      default:
        return 'bg-slate-500/20 text-slate-700 border-slate-500/30 dark:bg-slate-500/10 dark:text-slate-400 dark:border-slate-500/20';
    }
  };

  return (
    <>
      <div className="flex flex-col h-full">
        <PageHeader title="Documentos de Autorização para Intervenção Ambiental (DAIA)">
            {canPerformWriteActions(user) && (
                <Button size="sm" className="gap-1" onClick={handleAddNew}>
                    <PlusCircle className="h-4 w-4" />
                    Adicionar DAIA
                </Button>
            )}
        </PageHeader>
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <Card>
            <CardHeader>
              <CardTitle>Gerenciamento de DAIAs</CardTitle>
              <CardDescription>Acompanhe todas as autorizações para intervenção ambiental.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Empreendedor</TableHead>
                    <TableHead className="hidden md:table-cell">Nº do Processo</TableHead>
                    <TableHead className="hidden lg:table-cell">Tipo de Intervenção</TableHead>
                    <TableHead className="hidden lg:table-cell">Vencimento</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Anexo</TableHead>
                    {canPerformWriteActions(user) && (
                        <TableHead>
                            <span className="sr-only">Ações</span>
                        </TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading &&
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                        <TableCell className="hidden md:table-cell"><Skeleton className="h-5 w-24" /></TableCell>
                        <TableCell className="hidden lg:table-cell"><Skeleton className="h-5 w-32" /></TableCell>
                        <TableCell className="hidden lg:table-cell"><Skeleton className="h-5 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-24 rounded-full" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-6" /></TableCell>
                        <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                      </TableRow>
                    ))}
                  {!isLoading && intervencoes?.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{empreendedoresMap.get(item.empreendedorId) || 'Empreendedor não encontrado'}</TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground">{item.processNumber}</TableCell>
                      <TableCell className="hidden lg:table-cell text-muted-foreground">{item.description}</TableCell>
                      <TableCell className="hidden lg:table-cell text-muted-foreground">{formatDate(item.expirationDate)}</TableCell>
                      <TableCell>
                        <Badge variant={'outline'} className={cn(getStatusVariant(item.status))}>
                          {item.status}
                        </Badge>
                      </TableCell>
                       <TableCell>
                        {item.fileUrl && (
                          <Button asChild variant="ghost" size="icon">
                            <a href={item.fileUrl} target="_blank" rel="noopener noreferrer">
                              <Paperclip className="h-4 w-4" />
                            </a>
                          </Button>
                        )}
                      </TableCell>
                      {canPerformWriteActions(user) && (
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button aria-haspopup="true" size="icon" variant="ghost">
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Toggle menu</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Ações</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => handleEdit(item)}>Editar</DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => openDeleteConfirm(item.id)}
                              >
                                Deletar
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                   {!isLoading && intervencoes?.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={7} className="h-24 text-center">
                                Nenhuma intervenção encontrada.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </main>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-2xl h-full max-h-[90dvh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Editar DAIA' : 'Adicionar Nova DAIA'}</DialogTitle>
            <DialogDescription>
              {editingItem
                ? 'Atualize os detalhes da autorização abaixo.'
                : 'Preencha os detalhes para criar uma nova autorização.'}
            </DialogDescription>
          </DialogHeader>
          <IntervencaoForm
            currentItem={editingItem}
            onSuccess={() => setIsDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
      
      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isso irá deletar permanentemente a autorização.
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
