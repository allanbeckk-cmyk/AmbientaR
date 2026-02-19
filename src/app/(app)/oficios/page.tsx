
'use client';
import * as React from 'react';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, PlusCircle, FileText, Trash2, Edit, Check } from 'lucide-react';
import { useCollection, useFirebase, useMemoFirebase, errorEmitter } from '@/firebase';
import { collection, doc, deleteDoc, runTransaction, query, where } from 'firebase/firestore';
import type { Oficio } from '@/lib/types'; // Assuming Oficio type will be in types.ts
import { Skeleton } from '@/components/ui/skeleton';
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
import { useToast } from '@/hooks/use-toast';
import { FirestorePermissionError } from '@/firebase/errors';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { useRouter } from 'next/navigation';

export default function OficiosPage() {
  const [isAlertOpen, setIsAlertOpen] = React.useState(false);
  const [itemToDelete, setItemToDelete] = React.useState<string | null>(null);
  
  const router = useRouter();
  const { firestore, user } = useFirebase();
  const { toast } = useToast();

  const oficiosQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    if (user.role === 'client') {
      // Clients can only see oficios where they are the recipient.
      return query(collection(firestore, 'oficios'), where('recipient', '==', user.name));
    }
    // Other roles can see all oficios
    return collection(firestore, 'oficios');
  }, [firestore, user]);


  const { data: oficios, isLoading } = useCollection<Oficio>(oficiosQuery);

  const handleAddNew = () => {
    router.push('/oficios/new');
  };

  const handleEdit = (item: Oficio) => {
    if (item.status === 'Concluído') {
        toast({ variant: 'destructive', title: 'Ação não permitida', description: 'Ofícios concluídos não podem ser editados.' });
        return;
    }
    router.push(`/oficios/${item.id}/edit`);
  };
  
  const handleConcluir = async (item: Oficio) => {
    if(!firestore) return;
    
    const year = new Date().getFullYear();
    const counterRef = doc(firestore, 'oficioCounters', String(year));
    const oficioRef = doc(firestore, 'oficios', item.id);
    
    try {
       await runTransaction(firestore, async (transaction) => {
           const counterDoc = await transaction.get(counterRef);
           let newSequence = 1;
           if(counterDoc.exists()) {
               newSequence = counterDoc.data().lastSequence + 1;
           }
           
           const oficioNumber = `${String(newSequence).padStart(3, '0')}/${year}`;
           
           transaction.set(counterRef, { lastSequence: newSequence }, { merge: true });
           transaction.update(oficioRef, { 
               status: 'Concluído', 
               oficioNumber,
               sequence: newSequence,
               year: year,
               completedAt: new Date().toISOString()
            });
       });
       
       toast({ title: "Ofício Concluído!", description: `O ofício foi finalizado e numerado.`});

    } catch (e) {
        console.error("Transaction failed: ", e);
        toast({ variant: "destructive", title: "Erro ao Concluir", description: "Não foi possível gerar o número do ofício."});
    }
  }

  const openDeleteConfirm = (itemId: string) => {
    setItemToDelete(itemId);
    setIsAlertOpen(true);
  };

  const handleDelete = () => {
    if (!firestore || !itemToDelete) return;
    const docRef = doc(firestore, 'oficios', itemToDelete);
    deleteDoc(docRef)
      .then(() => {
        toast({
          title: 'Ofício deletado',
          description: 'O ofício foi removido com sucesso.',
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
  
  const canDelete = (item: Oficio) => {
      if(!user) return false;
      if (user.role === 'admin') return true;
      if (item.status === 'Rascunho' && item.createdBy === user.uid) return true;
      return false;
  }
  
  const formatDate = (timestamp: any): string => {
    if (!timestamp) return 'N/A';
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp.seconds * 1000);
      if (!isNaN(date.getTime())) return date.toLocaleString('pt-BR');
    } catch (e) {
      console.error('Error formatting timestamp:', e);
    }
    return 'Data inválida';
  };

  return (
    <>
      <div className="flex flex-col h-full">
        <PageHeader title="Ofícios e Comunicações">
          {user?.role !== 'client' && (
            <Button size="sm" className="gap-1" onClick={handleAddNew}>
              <PlusCircle className="h-4 w-4" />
              Novo Ofício
            </Button>
          )}
        </PageHeader>
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <Card>
            <CardHeader>
              <CardTitle>Gerenciamento de Ofícios</CardTitle>
              <CardDescription>Crie, edite e gerencie seus ofícios e comunicações internas/externas.</CardDescription>
            </CardHeader>
            <CardContent>
              <TooltipProvider>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[120px]">Nº Ofício</TableHead>
                    <TableHead>Data de Criação</TableHead>
                    <TableHead>Destinatário</TableHead>
                    <TableHead className="hidden md:table-cell">Assunto</TableHead>
                    <TableHead>Status</TableHead>
                    {user?.role !== 'client' && <TableHead className="hidden lg:table-cell">Criado por</TableHead>}
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading &&
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                        <TableCell className="hidden md:table-cell"><Skeleton className="h-5 w-48" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-24 rounded-full" /></TableCell>
                         <TableCell className="hidden lg:table-cell"><Skeleton className="h-5 w-24" /></TableCell>
                        <TableCell className="text-right"><Skeleton className="h-8 w-24" /></TableCell>
                      </TableRow>
                    ))}
                  {!isLoading && oficios?.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-mono">{item.oficioNumber || 'Rascunho'}</TableCell>
                      <TableCell className="text-muted-foreground">{formatDate(item.createdAt)}</TableCell>
                      <TableCell className="font-medium">{item.recipient}</TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground truncate max-w-xs">{item.subject}</TableCell>
                      <TableCell>
                        <Badge variant={item.status === 'Concluído' ? 'default' : 'secondary'}
                          className={cn(item.status === 'Concluído' && 'bg-emerald-500/20 text-emerald-700 border-emerald-500/30')}
                        >{item.status}</Badge>
                      </TableCell>
                       {user?.role !== 'client' && <TableCell className="hidden lg:table-cell text-muted-foreground">{item.creatorName}</TableCell>}
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Tooltip>
                            <TooltipTrigger asChild><Button variant="ghost" size="icon" onClick={() => alert('Visualização em breve!')}><FileText className="h-4 w-4" /></Button></TooltipTrigger>
                            <TooltipContent><p>Visualizar/Imprimir</p></TooltipContent>
                          </Tooltip>
                          {user?.role !== 'client' && (
                            <>
                              <Tooltip>
                                <TooltipTrigger asChild><Button variant="ghost" size="icon" onClick={() => handleEdit(item)} disabled={item.status === 'Concluído'}><Edit className="h-4 w-4" /></Button></TooltipTrigger>
                                <TooltipContent><p>Editar ofício</p></TooltipContent>
                              </Tooltip>
                              {item.status === 'Rascunho' && (
                              <Tooltip>
                                <TooltipTrigger asChild><Button variant="ghost" size="icon" onClick={() => handleConcluir(item)}><Check className="h-4 w-4" /></Button></TooltipTrigger>
                                <TooltipContent><p>Concluir e Gerar Número</p></TooltipContent>
                              </Tooltip>
                              )}
                              <Tooltip>
                                <TooltipTrigger asChild><Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => openDeleteConfirm(item.id)} disabled={!canDelete(item)}><Trash2 className="h-4 w-4" /></Button></TooltipTrigger>
                                <TooltipContent><p>Deletar ofício</p></TooltipContent>
                              </Tooltip>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                   {!isLoading && oficios?.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={7} className="h-24 text-center">
                                Nenhum ofício encontrado.
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
      
      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita e irá deletar o ofício permanentemente.
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
