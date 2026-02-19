
'use client';
import { useMemo, useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
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
import { useCollection, useFirestore, useUser as useAuthUser, useMemoFirebase, errorEmitter } from '@/firebase';
import { collection, doc, deleteDoc, query, where, getDocs } from 'firebase/firestore';
import type { Project, Empreendedor } from '@/lib/types';
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
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';

const DetailItem = ({ label, value }: { label: string, value?: string | null }) => (
    <div className="space-y-1">
        <Label className="text-sm font-medium">{label}</Label>
        <p className="text-sm text-muted-foreground">{value || 'Não informado'}</p>
    </div>
);

function ProjectsPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const statusFilter = searchParams.get('status');

  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [itemToView, setItemToView] = useState<Project | null>(null);

  const firestore = useFirestore();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const canWrite = user && (user.role === 'admin' || user.role === 'supervisor' || user.role === 'gestor');

  const [empreendedorIdsForUser, setEmpreendedorIdsForUser] = useState<string[] | undefined>(undefined);

  useEffect(() => {
    if (user?.role === 'client' && firestore) {
        setEmpreendedorIdsForUser(undefined);
        const userDocuments = [user.cpf, ...(user.cnpjs || [])].filter(Boolean) as string[];
        if (userDocuments.length > 0) {
            const empreendedoresRef = collection(firestore, 'empreendedores');
            const q = query(empreendedoresRef, where('cpfCnpj', 'in', userDocuments));
            getDocs(q).then(snapshot => {
                const ids = snapshot.docs.map(doc => doc.id);
                setEmpreendedorIdsForUser(ids.length > 0 ? ids : ['invalid-placeholder-for-empty-query']);
            }).catch(err => {
                console.error("Error fetching empreendedor IDs:", err);
                setEmpreendedorIdsForUser(['invalid-placeholder-for-empty-query']);
            });
        } else {
            setEmpreendedorIdsForUser(['invalid-placeholder-for-empty-query']);
        }
    }
  }, [user, firestore]);
  
  const projectsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;

    if (user.role === 'client' || user.role === 'technical') {
      if (empreendedorIdsForUser === undefined) {
        return null;
      }
      if (empreendedorIdsForUser.length === 0) {
          // If a client has no empreendedores, return a query that finds nothing.
          return query(collection(firestore, 'projects'), where('empreendedorId', 'in', ['invalid-placeholder']));
      }
      return query(collection(firestore, 'projects'), where('empreendedorId', 'in', empreendedorIdsForUser));
    }
    
    return collection(firestore, 'projects');
  }, [firestore, user, empreendedorIdsForUser]);
  
  const { data: allProjects, isLoading: isLoadingProjects } = useCollection<Project>(projectsQuery);

  const empreendedoresQuery = useMemoFirebase(() => firestore ? collection(firestore, 'empreendedores') : null, [firestore]);
  const { data: empreendedores, isLoading: isLoadingEmpreendedores } = useCollection<Empreendedor>(empreendedoresQuery);
  const empreendedoresMap = new Map(empreendedores?.map(c => [c.id, c.name]));

  const isLoading = isLoadingProjects || isLoadingEmpreendedores || (user?.role === 'client' && empreendedorIdsForUser === undefined);
  
  const filteredProjects = useMemo(() => {
    if (!allProjects) return [];
    if (!statusFilter) return allProjects;
    
    if (statusFilter === 'andamento') {
      return allProjects.filter(p => p.status !== 'Vencida' && p.status !== 'Cancelada');
    }
    if (statusFilter === 'concluido') {
      return allProjects.filter(p => p.status === 'Vencida' || p.status === 'Cancelada');
    }
    return allProjects;
  }, [allProjects, statusFilter]);

  const handleAddNew = () => {
    router.push('/projects/new');
  };

  const handleEdit = (item: Project) => {
    router.push(`/projects/${item.id}/edit`);
  };

  const handleView = (item: Project) => {
    setItemToView(item);
    setIsViewOpen(true);
  };

  const openDeleteConfirm = (itemId: string) => {
    setItemToDelete(itemId);
    setIsAlertOpen(true);
  };

  const handleDelete = () => {
    if (!firestore || !itemToDelete) return;
    const docRef = doc(firestore, 'projects', itemToDelete);
    deleteDoc(docRef)
      .then(() => {
        toast({
          title: 'Projeto deletado',
          description: 'O projeto foi removido com sucesso.',
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
        <PageHeader title="Empreendimentos">
          {canWrite && (
            <Button size="sm" className="gap-1" onClick={handleAddNew}>
                <PlusCircle className="h-4 w-4" />
                Adicionar Empreendimento
            </Button>
          )}
        </PageHeader>
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <Card>
            <CardHeader>
              <CardTitle>Gerenciamento de Empreendimentos</CardTitle>
              <CardDescription>Cadastre, edite e visualize os empreendimentos.</CardDescription>
            </CardHeader>
            <CardContent>
             <TooltipProvider>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Empreendimento</TableHead>
                    <TableHead>Município</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading &&
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                        <TableCell className="text-right"><Skeleton className="h-8 w-24" /></TableCell>
                      </TableRow>
                    ))}
                  {!isLoading && filteredProjects?.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.propertyName}</TableCell>
                      <TableCell className="text-muted-foreground">{item.municipio || 'N/A'}</TableCell>
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
                                    <TooltipContent><p>Editar empreendimento</p></TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => openDeleteConfirm(item.id)}>
                                            <Trash2 className="h-4 w-4" />
                                            <span className="sr-only">Deletar</span>
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent><p>Deletar empreendimento</p></TooltipContent>
                                </Tooltip>
                                </>
                            )}
                            </div>
                      </TableCell>
                    </TableRow>
                  ))}
                   {!isLoading && filteredProjects?.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={3} className="h-24 text-center">
                                Nenhum empreendimento encontrado.
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
                    <DialogTitle>{itemToView?.propertyName}</DialogTitle>
                    <DialogDescription>
                        Detalhes do empreendimento.
                    </DialogDescription>
                </DialogHeader>
                {itemToView && (
                     <div className="max-h-[60vh] overflow-y-auto pr-4 space-y-4">
                        <DetailItem label="Nome da Propriedade" value={itemToView.propertyName} />
                        <DetailItem label="Nome Fantasia" value={itemToView.fantasyName} />
                        <Separator />
                        <DetailItem label="Atividade Principal" value={itemToView.activity} />
                        <Separator />
                        <div className="grid grid-cols-2 gap-4">
                           <DetailItem label="Matrícula" value={itemToView.matricula} />
                           <DetailItem label="Comarca" value={itemToView.comarca} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <DetailItem label="Código INCRA" value={itemToView.incraCode} />
                            <DetailItem label="CNPJ" value={itemToView.cnpj} />
                        </div>
                        <Separator />
                        <h4 className="font-semibold text-foreground">Endereço</h4>
                        <DetailItem label="Endereço" value={`${itemToView.address || ''}, ${itemToView.numero || ''}`} />
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
      
      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isso irá deletar permanentemente o empreendimento.
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

export default function ProjectsPage() {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <ProjectsPageContent />
    </Suspense>
  )
}
