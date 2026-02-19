
'use client';
import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, PlusCircle, Paperclip, Eye, Pencil, Trash2 } from 'lucide-react';
import { useCollection, useFirestore, useUser, useMemoFirebase, errorEmitter } from '@/firebase';
import { collection, doc, deleteDoc } from 'firebase/firestore';
import type { Revenue, Client } from '@/lib/types';
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
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

type RevenueTableProps = {
  revenues?: Revenue[] | null;
  isLoadingRevenues?: boolean;
};

export function RevenueTable({ revenues: revenuesProp, isLoadingRevenues: isLoadingRevenuesProp }: RevenueTableProps = {}) {
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const router = useRouter();

  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();

  const revenuesQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return collection(firestore, 'revenues');
  }, [firestore, user]);

  const { data: hookRevenues, isLoading: hookRevenuesLoading } = useCollection<Revenue>(revenuesProp !== undefined ? null : revenuesQuery);
  const revenues = revenuesProp !== undefined ? (revenuesProp ?? []) : (hookRevenues ?? []);
  const isLoadingRevenues = revenuesProp !== undefined ? (isLoadingRevenuesProp ?? false) : hookRevenuesLoading;

  const clientsQuery = useMemoFirebase(() => firestore ? collection(firestore, 'clients') : null, [firestore]);
  const { data: clients, isLoading: isLoadingClients } = useCollection<Client>(clientsQuery);
  const clientsMap = useMemo(() => new Map(clients?.map(c => [c.id, c.name])), [clients]);


  const handleAddNew = () => {
    router.push('/cash-flow/new?type=revenue');
  };

  const handleEdit = (item: Revenue) => {
    router.push(`/cash-flow/${item.id}/edit?type=revenue`);
  };

  const openDeleteConfirm = (itemId: string) => {
    setItemToDelete(itemId);
    setIsAlertOpen(true);
  };

  const handleDelete = () => {
    if (!firestore || !itemToDelete) return;
    
    const itemDocRef = doc(firestore, 'revenues', itemToDelete);
    deleteDoc(itemDocRef)
      .then(() => {
        toast({
          title: 'Receita deletada',
          description: 'O lançamento foi removido com sucesso.',
        });
      })
      .catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
          path: itemDocRef.path,
          operation: 'delete',
        });
        errorEmitter.emit('permission-error', permissionError);
      })
      .finally(() => {
        setIsAlertOpen(false);
        setItemToDelete(null);
      });
  };
  
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('pt-BR', { timeZone: 'UTC' });

  const isLoading = isLoadingRevenues || isLoadingClients;

  return (
    <>
     <div className="flex justify-end mb-4">
        <Button size="sm" className="gap-1" onClick={handleAddNew}>
          <PlusCircle className="h-4 w-4" />
          Adicionar Receita
        </Button>
      </div>
      <TooltipProvider>
        <Table>
            <TableHeader>
            <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Anexo</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead className="text-right">Ações</TableHead>
            </TableRow>
            </TableHeader>
            <TableBody>
            {isLoading &&
                Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-6" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-5 w-20 ml-auto" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-8 w-24" /></TableCell>
                </TableRow>
                ))}
            {revenues?.map((item) => (
                <TableRow key={item.id}>
                <TableCell className="text-muted-foreground">{formatDate(item.date)}</TableCell>
                <TableCell className="font-medium">{item.description}</TableCell>
                <TableCell className="text-muted-foreground">{item.clientId ? clientsMap.get(item.clientId) || 'N/A' : 'N/A'}</TableCell>
                <TableCell>
                    {item.fileUrl && (
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button asChild variant="ghost" size="icon">
                                <a href={item.fileUrl} target="_blank" rel="noopener noreferrer">
                                <Paperclip className="h-4 w-4" />
                                </a>
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent><p>Ver anexo</p></TooltipContent>
                    </Tooltip>
                    )}
                </TableCell>
                <TableCell className="text-right text-emerald-600 dark:text-emerald-500 font-medium">
                    {formatCurrency(item.amount)}
                </TableCell>
                <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" onClick={() => handleEdit(item)}>
                                    <Pencil className="h-4 w-4" />
                                    <span className="sr-only">Editar</span>
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent><p>Editar Lançamento</p></TooltipContent>
                        </Tooltip>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => openDeleteConfirm(item.id)}>
                                    <Trash2 className="h-4 w-4" />
                                    <span className="sr-only">Deletar</span>
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent><p>Deletar Lançamento</p></TooltipContent>
                        </Tooltip>
                    </div>
                </TableCell>
                </TableRow>
            ))}
            {!isLoading && (!revenues || revenues.length === 0) && (
                <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">Nenhuma receita encontrada.</TableCell>
                </TableRow>
            )}
            </TableBody>
        </Table>
      </TooltipProvider>
      
      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isso irá deletar permanentemente o lançamento.
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
