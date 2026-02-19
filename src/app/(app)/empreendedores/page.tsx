
'use client';
import { useMemo, useState } from 'react';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, PlusCircle, Import, Eye, Pencil, Trash2 } from 'lucide-react';
import { useCollection, useFirestore, useUser as useAuthUser, useMemoFirebase, errorEmitter } from '@/firebase';
import { collection, doc, deleteDoc, query, where, OrFilterConstraint } from 'firebase/firestore';
import type { Client, Empreendedor } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
    DialogClose
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
import { useToast } from '@/hooks/use-toast';
import { FirestorePermissionError } from '@/firebase/errors';
import { useAuth } from '@/firebase';
import { ClientImportDialog } from './client-import-dialog';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';

const DetailItem = ({ label, value }: { label: string, value?: string | null | string[] }) => (
    <div className="space-y-1">
        <Label className="text-sm font-medium">{label}</Label>
        <p className="text-sm text-muted-foreground">{Array.isArray(value) ? value.join(', ') : (value || 'Não informado')}</p>
    </div>
);


export default function EmpreendedoresPage() {
  const router = useRouter();
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [itemToView, setItemToView] = useState<Empreendedor | null>(null);

  const firestore = useFirestore();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const canWrite = user && (user.role === 'admin' || user.role === 'supervisor' || user.role === 'gestor');

  const empreendedoresQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    
    if (user.role === 'client') {
      const userDocuments = [user.cpf, ...(user.cnpjs || [])].filter(Boolean) as string[];
      if (userDocuments.length > 0) {
        return query(collection(firestore, 'empreendedores'), where('cpfCnpj', 'in', userDocuments));
      } else {
        return query(collection(firestore, 'empreendedores'), where('cpfCnpj', '==', 'invalid-placeholder-for-empty-query'));
      }
    }
    
    return collection(firestore, 'empreendedores');
  }, [firestore, user]);

  const { data: empreendedores, isLoading } = useCollection<Empreendedor>(empreendedoresQuery);

  const handleAddNew = () => {
    router.push('/empreendedores/new');
  };

  const handleEdit = (item: Empreendedor) => {
    router.push(`/empreendedores/${item.id}/edit`);
  };

  const handleView = (item: Empreendedor) => {
    setItemToView(item);
    setIsViewOpen(true);
  };

  const openDeleteConfirm = (itemId: string) => {
    setItemToDelete(itemId);
    setIsAlertOpen(true);
  };

  const handleDelete = () => {
    if (!firestore || !itemToDelete) return;
    
    const docRef = doc(firestore, 'empreendedores', itemToDelete);
    deleteDoc(docRef)
      .then(() => {
        toast({
          title: 'Empreendedor deletado',
          description: 'O empreendedor foi removido com sucesso.',
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

  return (
    <>
      <div className="flex flex-col h-full">
        <PageHeader title="Empreendedores">
          <div className='flex gap-2'>
            {canWrite && (
              <>
                 <Button size="sm" className="gap-1" variant="outline" onClick={() => setIsImportOpen(true)}>
                  <Import className="h-4 w-4" />
                  Importar de Clientes
                </Button>
                <Button size="sm" className="gap-1" onClick={handleAddNew}>
                  <PlusCircle className="h-4 w-4" />
                  Adicionar Empreendedor
                </Button>
              </>
            )}
          </div>
        </PageHeader>
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <Card>
            <CardHeader>
              <CardTitle>Gerenciamento de Empreendedores</CardTitle>
               <CardDescription>Adicione, edite e visualize todos os seus empreendedores (clientes técnicos).</CardDescription>
            </CardHeader>
            <CardContent>
              <TooltipProvider>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead className="hidden sm:table-cell">CPF/CNPJ</TableHead>
                    <TableHead className="hidden md:table-cell">Email</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading &&
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell>
                          <Skeleton className="h-5 w-32" />
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <Skeleton className="h-5 w-32" />
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <Skeleton className="h-5 w-48" />
                        </TableCell>
                        <TableCell className="text-right">
                            <Skeleton className="h-8 w-24" />
                        </TableCell>
                      </TableRow>
                    ))}
                  {empreendedores?.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                       <TableCell className="hidden sm:table-cell text-muted-foreground">
                        {item.cpfCnpj}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground">
                        {item.email}
                      </TableCell>
                      <TableCell className="text-right">
                           <div className="flex items-center justify-end gap-1">
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button variant="ghost" size="icon" onClick={() => handleView(item)}>
                                            <Eye className="h-4 w-4" />
                                            <span className="sr-only">Visualizar</span>
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent><p>Visualizar detalhes</p></TooltipContent>
                                </Tooltip>
                            {canWrite && (
                                <>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button variant="ghost" size="icon" onClick={() => handleEdit(item)}>
                                            <Pencil className="h-4 w-4" />
                                            <span className="sr-only">Editar</span>
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent><p>Editar empreendedor</p></TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => openDeleteConfirm(item.id)}>
                                            <Trash2 className="h-4 w-4" />
                                            <span className="sr-only">Deletar</span>
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent><p>Deletar empreendedor</p></TooltipContent>
                                </Tooltip>
                                </>
                            )}
                            </div>
                      </TableCell>
                    </TableRow>
                  ))}
                   {!isLoading && empreendedores?.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={4} className="h-24 text-center">
                                Nenhum empreendedor encontrado.
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
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>{itemToView?.name}</DialogTitle>
                    <DialogDescription>
                        Detalhes do empreendedor cadastrado.
                    </DialogDescription>
                </DialogHeader>
                {itemToView && (
                    <div className="max-h-[60vh] overflow-y-auto pr-4 space-y-4">
                        <DetailItem label="Nome / Razão Social" value={itemToView.name} />
                        <Separator />
                        <div className="grid grid-cols-2 gap-4">
                           <DetailItem label="CPF/CNPJ" value={itemToView.cpfCnpj} />
                           <DetailItem label="Tipo" value={itemToView.entityType} />
                        </div>
                         <DetailItem label="CTF/IBAMA" value={itemToView.ctfIbama} />
                        <Separator />
                        <h4 className="font-semibold text-foreground">Contato & Endereço</h4>
                        <DetailItem label="Email" value={itemToView.email} />
                        <DetailItem label="Telefone" value={itemToView.phone} />
                         <DetailItem label="Endereço" value={`${itemToView.address || ''}, ${itemToView.numero || ''}`} />
                         <DetailItem label="Bairro/Distrito" value={itemToView.bairro} />
                         <div className="grid grid-cols-3 gap-4">
                            <DetailItem label="Município" value={itemToView.municipio} />
                            <DetailItem label="UF" value={itemToView.uf} />
                            <DetailItem label="CEP" value={itemToView.cep} />
                        </div>
                    </div>
                )}
                 <DialogFooter>
                    <DialogClose asChild>
                        <Button type="button" variant="outline">
                        Fechar
                        </Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>


      {canWrite && (
        <ClientImportDialog 
            isOpen={isImportOpen} 
            onOpenChange={setIsImportOpen} 
            onImportSuccess={() => {
                setIsImportOpen(false);
            }}
        />
      )}

      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isso irá deletar permanentemente o empreendedor.
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
