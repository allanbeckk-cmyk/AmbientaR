
'use client';
import { useState, useMemo } from 'react';
import Link from 'next/link';
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
import { MoreHorizontal, PlusCircle, Pencil, Trash2, Eye } from 'lucide-react';
import { useCollection, useFirestore, useUser, useMemoFirebase, errorEmitter } from '@/firebase';
import { collection, doc, deleteDoc } from 'firebase/firestore';
import type { EnvironmentalCompany } from '@/lib/types';
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
import { useToast } from '@/hooks/use-toast';
import { FirestorePermissionError } from '@/firebase/errors';
import { useAuth } from '@/firebase';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';

const DetailItem = ({ label, value }: { label: string, value?: string | null | string[] }) => (
    <div className="space-y-1">
        <Label className="text-sm font-medium">{label}</Label>
        <p className="text-sm text-muted-foreground">{Array.isArray(value) ? value.join(', ') : (value || 'Não informado')}</p>
    </div>
);

export default function ResponsibleCompanyPage() {
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [viewingItem, setViewingItem] = useState<EnvironmentalCompany | null>(null);

  const { user } = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const canWrite = user && (user.role === 'admin' || user.role === 'supervisor' || user.role === 'gestor');

  const companiesQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return collection(firestore, 'environmentalCompanies');
  }, [firestore, user]);

  const { data: companies, isLoading } = useCollection<EnvironmentalCompany>(companiesQuery);

  const handleView = (item: EnvironmentalCompany) => {
    setViewingItem(item);
    setIsViewOpen(true);
  };

  const openDeleteConfirm = (itemId: string) => {
    setItemToDelete(itemId);
    setIsAlertOpen(true);
  };

  const handleDelete = () => {
    if (!firestore || !itemToDelete) return;
    const docRef = doc(firestore, 'environmentalCompanies', itemToDelete);
    deleteDoc(docRef)
      .then(() => {
        toast({
          title: 'Empresa deletada',
          description: 'A empresa foi removida com sucesso.',
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
        <PageHeader title="Empresas Responsáveis">
          {canWrite && (
            <Button size="sm" className="gap-1" asChild>
                <Link href="/responsible-company/new">
                    <PlusCircle className="h-4 w-4" />
                    Adicionar Empresa Responsável
                </Link>
            </Button>
          )}
        </PageHeader>
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <Card>
            <CardHeader>
              <CardTitle>Gerenciamento de Empresas Responsáveis</CardTitle>
              <CardDescription>Adicione, edite e visualize as empresas parceiras.</CardDescription>
            </CardHeader>
            <CardContent>
              <TooltipProvider>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Razão Social</TableHead>
                    <TableHead>CNPJ</TableHead>
                    <TableHead className="hidden md:table-cell">Email</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading &&
                    Array.from({ length: 3 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                        <TableCell className="hidden md:table-cell"><Skeleton className="h-5 w-48" /></TableCell>
                        <TableCell className="text-right"><Skeleton className="h-8 w-24" /></TableCell>
                      </TableRow>
                    ))}
                  {!isLoading && companies?.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>{item.cnpj}</TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground">{item.email}</TableCell>
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
                                        <Button variant="ghost" size="icon" asChild>
                                            <Link href={`/responsible-company/${item.id}/edit`}>
                                                <Pencil className="h-4 w-4" />
                                                <span className="sr-only">Editar</span>
                                            </Link>
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent><p>Editar empresa</p></TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => openDeleteConfirm(item.id)}>
                                            <Trash2 className="h-4 w-4" />
                                            <span className="sr-only">Deletar</span>
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent><p>Deletar empresa</p></TooltipContent>
                                </Tooltip>
                                </>
                            )}
                         </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {!isLoading && companies?.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="h-24 text-center">
                        Nenhuma empresa encontrada.
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
                    <DialogTitle>{viewingItem?.name}</DialogTitle>
                    <DialogDescription>
                        Detalhes da empresa.
                    </DialogDescription>
                </DialogHeader>
                {viewingItem && (
                    <div className="max-h-[60vh] overflow-y-auto pr-4 space-y-4">
                        <DetailItem label="Razão Social" value={viewingItem.name} />
                        <DetailItem label="Nome Fantasia" value={viewingItem.fantasyName} />
                        <DetailItem label="CNPJ" value={viewingItem.cnpj} />
                        <Separator />
                        <h4 className="font-semibold text-foreground">Contato & Endereço</h4>
                        <DetailItem label="Email" value={viewingItem.email} />
                        <DetailItem label="Telefone" value={viewingItem.phone ? `(${viewingItem.ddd}) ${viewingItem.phone}` : ''} />
                         <DetailItem label="Endereço" value={`${viewingItem.address || ''}, ${viewingItem.numero || ''}`} />
                         <div className="grid grid-cols-3 gap-4">
                            <DetailItem label="Município" value={viewingItem.municipio} />
                            <DetailItem label="UF" value={viewingItem.uf} />
                            <DetailItem label="CEP" value={viewingItem.cep} />
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
              Esta ação não pode ser desfeita. Isso irá deletar permanentemente a empresa.
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
