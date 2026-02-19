
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
import { MoreHorizontal, PlusCircle, Eye, Pencil, Trash2 } from 'lucide-react';
import { useCollection, useFirebase, useMemoFirebase, errorEmitter } from '@/firebase';
import { collection, doc, deleteDoc, query, where } from 'firebase/firestore';
import type { Client } from '@/lib/types';
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
import { logUserAction } from '@/lib/audit-log';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';

const DetailItem = ({ label, value }: { label: string, value?: string | null | string[] }) => (
    <div className="space-y-1">
        <Label className="text-sm font-medium">{label}</Label>
        <p className="text-sm text-muted-foreground">{Array.isArray(value) ? value.join(', ') : (value || 'Não informado')}</p>
    </div>
);

export default function ClientsPage() {
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<string | null>(null);
  const [clientToView, setClientToView] = useState<Client | null>(null);

  const { firestore, auth } = useFirebase();
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const clientsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    
    if (user.role === 'admin' || user.role === 'sales' || user.role === 'financial' || user.role === 'supervisor') {
      return collection(firestore, 'clients');
    }
    
    if (user.role === 'client') {
      const userDocuments = [user.cpf, ...(user.cnpjs || [])].filter(Boolean) as string[];
      if (userDocuments.length > 0) {
        return query(collection(firestore, 'clients'), where('cpfCnpj', 'in', userDocuments));
      } else {
        return query(collection(firestore, 'clients'), where('cpfCnpj', '==', 'invalid-placeholder-for-empty-query'));
      }
    }
    
    return query(collection(firestore, 'clients'), where('cpfCnpj', '==', 'invalid-placeholder-for-empty-query'));
  }, [firestore, user]);

  const { data: clients, isLoading } = useCollection<Client>(clientsQuery);

  const handleAddNew = () => {
    router.push('/clients/new');
  };

  const handleEdit = (client: Client) => {
    router.push(`/clients/${client.id}/edit`);
  };
  
  const handleView = (client: Client) => {
      setClientToView(client);
      setIsViewOpen(true);
  };

  const openDeleteConfirm = (clientId: string) => {
    setClientToDelete(clientId);
    setIsAlertOpen(true);
  };

  const handleDelete = () => {
    if (!firestore || !auth || !clientToDelete) return;
    
    const clientDocRef = doc(firestore, 'clients', clientToDelete);
    deleteDoc(clientDocRef)
      .then(() => {
        toast({
          title: 'Cliente deletado',
          description: 'O cliente foi removido com sucesso.',
        });
        const deletedClient = clients?.find(c => c.id === clientToDelete);
        logUserAction(firestore, auth, 'delete_client', { clientId: clientToDelete, clientName: deletedClient?.name || 'N/A' });
      })
      .catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
          path: clientDocRef.path,
          operation: 'delete',
        });
        errorEmitter.emit('permission-error', permissionError);
      })
      .finally(() => {
        setIsAlertOpen(false);
        setClientToDelete(null);
      });
  };

  return (
    <>
      <div className="flex flex-col h-full">
        <PageHeader title="Clientes">
          <Button size="sm" className="gap-1" onClick={handleAddNew}>
            <PlusCircle className="h-4 w-4" />
            Adicionar Cliente
          </Button>
        </PageHeader>
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <Card>
            <CardHeader>
              <CardTitle>Gerenciamento de Clientes</CardTitle>
               <CardDescription>Adicione, edite e visualize todos os seus clientes comerciais.</CardDescription>
            </CardHeader>
            <CardContent>
              <TooltipProvider>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>CPF/CNPJ</TableHead>
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
                          <TableCell>
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
                    {clients?.map((client) => (
                      <TableRow key={client.id}>
                        <TableCell className="font-medium">{client.name}</TableCell>
                         <TableCell className="text-muted-foreground">
                          {client.cpfCnpj}
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-muted-foreground">
                          {client.email}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                               <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button variant="ghost" size="icon" onClick={() => handleView(client)}>
                                            <Eye className="h-4 w-4" />
                                            <span className="sr-only">Visualizar</span>
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent><p>Visualizar detalhes</p></TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button variant="ghost" size="icon" onClick={() => handleEdit(client)}>
                                            <Pencil className="h-4 w-4" />
                                            <span className="sr-only">Editar</span>
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent><p>Editar cliente</p></TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => openDeleteConfirm(client.id)}>
                                            <Trash2 className="h-4 w-4" />
                                            <span className="sr-only">Deletar</span>
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent><p>Deletar cliente</p></TooltipContent>
                                </Tooltip>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                     {!isLoading && clients?.length === 0 && (
                          <TableRow>
                              <TableCell colSpan={4} className="h-24 text-center">
                                  Nenhum cliente encontrado.
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
                    <DialogTitle>{clientToView?.name}</DialogTitle>
                    <DialogDescription>
                        Detalhes do cliente cadastrado.
                    </DialogDescription>
                </DialogHeader>
                {clientToView && (
                    <div className="max-h-[60vh] overflow-y-auto pr-4 space-y-4">
                        <DetailItem label="Nome / Razão Social" value={clientToView.name} />
                        <Separator />
                        <div className="grid grid-cols-2 gap-4">
                           <DetailItem label="CPF/CNPJ" value={clientToView.cpfCnpj} />
                           <DetailItem label="Tipo" value={clientToView.entityType} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                           <DetailItem label="Identidade (RG)" value={clientToView.identidade} />
                           <DetailItem label="Órgão Emissor" value={clientToView.emissor} />
                        </div>
                         <div className="grid grid-cols-2 gap-4">
                           <DetailItem label="Nacionalidade" value={clientToView.nacionalidade} />
                           <DetailItem label="Estado Civil" value={clientToView.estadoCivil} />
                        </div>
                         <DetailItem label="Data de Nascimento" value={clientToView.dataNascimento ? new Date(clientToView.dataNascimento).toLocaleDateString('pt-BR') : ''} />
                         <DetailItem label="CTF/IBAMA" value={clientToView.ctfIbama} />
                        <Separator />
                        <h4 className="font-semibold text-foreground">Contato & Endereço</h4>
                        <DetailItem label="Email" value={clientToView.email} />
                        <DetailItem label="Telefone" value={clientToView.phone} />
                         <DetailItem label="Endereço" value={`${clientToView.address || ''}, ${clientToView.numero || ''}`} />
                         <DetailItem label="Bairro/Distrito" value={clientToView.bairro} />
                         <div className="grid grid-cols-3 gap-4">
                            <DetailItem label="Município" value={clientToView.municipio} />
                            <DetailItem label="UF" value={clientToView.uf} />
                            <DetailItem label="CEP" value={clientToView.cep} />
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

      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isso irá deletar permanentemente o cliente.
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
