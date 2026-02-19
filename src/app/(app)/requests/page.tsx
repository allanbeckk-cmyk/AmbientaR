'use client';
import * as React from 'react';
import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
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
    DialogClose
} from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { MoreHorizontal, PlusCircle, Eye, Pencil, Trash2, FileText, CheckCircle, FolderOpen } from 'lucide-react';
import { useCollection, useFirebase, useMemoFirebase, errorEmitter } from '@/firebase';
import { collection, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import type { Request, Empreendedor, Project, AppUser } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { FirestorePermissionError } from '@/firebase/errors';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/firebase';

const DetailItem = ({ label, value }: { label: string, value?: string | string[] | null }) => (
    <div className="space-y-1">
        <Label className="text-sm font-medium">{label}</Label>
        <div className="text-sm text-muted-foreground">
            {Array.isArray(value) ? (
                <ul className="list-disc pl-5">
                    {value.map((item, index) => <li key={index}>{item}</li>)}
                </ul>
            ) : (value || 'Não informado')}
        </div>
    </div>
);

const canWrite = (user: AppUser | null): boolean => {
    if (!user) return false;
    return user.role === 'admin' || user.role === 'supervisor' || user.role === 'gestor' || user.role === 'technical';
}

const getStatusLabel = (status: Request['status']) => {
    const statusMap = {
        'Draft': 'Rascunho',
        'Submitted': 'Enviado',
        'In Progress': 'Em Andamento',
        'Completed': 'Concluído'
    };
    return statusMap[status] || status;
};

export default function RequestsPage() {
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [viewingItem, setViewingItem] = useState<Request | null>(null);
  const router = useRouter();

  const { user } = useAuth();
  const { firestore } = useFirebase();
  const { toast } = useToast();

  const requestsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    // Client-side filtering will handle role access for now
    return collection(firestore, 'requests');
  }, [firestore, user]);

  const { data: requests, isLoading: isLoadingRequests } = useCollection<Request>(requestsQuery);

  const empreendedoresQuery = useMemoFirebase(() => firestore ? collection(firestore, 'empreendedores') : null, [firestore]);
  const { data: empreendedores, isLoading: isLoadingEmpreendedores } = useCollection<Empreendedor>(empreendedoresQuery);
  const empreendedoresMap = React.useMemo(() => new Map(empreendedores?.map(e => [e.id, e.name])), [empreendedores]);

  const projectsQuery = useMemoFirebase(() => firestore ? collection(firestore, 'projects') : null, [firestore]);
  const { data: projects, isLoading: isLoadingProjects } = useCollection<Project>(projectsQuery);
  const projectsMap = React.useMemo(() => new Map(projects?.map(p => [p.id, p.propertyName])), [projects]);

  const isLoading = isLoadingRequests || isLoadingEmpreendedores || isLoadingProjects;

  const { draftRequests, approvedRequests } = useMemo(() => {
    if (!requests) return { draftRequests: [], approvedRequests: [] };
    const drafts = requests.filter(r => r.status !== 'Completed');
    const approved = requests.filter(r => r.status === 'Completed');
    return { draftRequests: drafts, approvedRequests: approved };
  }, [requests]);

  const handleAddNew = () => {
    router.push('/requests/new');
  };

  const handleEdit = (item: Request) => {
    router.push(`/requests/${item.id}/edit`);
  };
  
  const handleView = (item: Request) => {
    setViewingItem(item);
    setIsViewOpen(true);
  };
  
  const handleApprove = () => {
      toast({ title: "Funcionalidade em desenvolvimento." });
  }
  
  const handleExportPdf = () => {
      toast({ title: "Funcionalidade em desenvolvimento." });
  }


  const openDeleteConfirm = (itemId: string) => {
    setItemToDelete(itemId);
    setIsAlertOpen(true);
  };

  const handleDelete = () => {
    if (!firestore || !itemToDelete) return;
    const docRef = doc(firestore, 'requests', itemToDelete);
    deleteDoc(docRef)
      .then(() => {
        toast({ title: 'Solicitação deletada', description: 'A solicitação foi removida com sucesso.' });
      })
      .catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({ path: docRef.path, operation: 'delete' });
        errorEmitter.emit('permission-error', permissionError);
      })
      .finally(() => {
        setIsAlertOpen(false);
        setItemToDelete(null);
      });
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('pt-BR');
  };

  const getSolicitationNumber = (request: Request) => {
    const year = request.createdAt ? (request.createdAt.toDate ? request.createdAt.toDate() : new Date(request.createdAt)).getFullYear() : 'S/A';
    return request.solicitationNumber || `${request.id.substring(0,8).toUpperCase()}/${year}`;
  }


  return (
    <>
      <div className="flex flex-col h-full">
        <PageHeader title="Processos">
          <Button size="sm" className="gap-1" onClick={handleAddNew}>
            <PlusCircle className="h-4 w-4" />
            Novo Processo
          </Button>
        </PageHeader>
        <main className="flex-1 overflow-auto p-4 md:p-6 space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Gerenciamento de Processos - Elaboração</CardTitle>
              <CardDescription>Visualize e gerencie todas as solicitações de novos processos ambientais que estão em andamento.</CardDescription>
            </CardHeader>
            <CardContent>
                <TooltipProvider>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nº Processo</TableHead>
                                <TableHead>Dt. Criação</TableHead>
                                <TableHead>Empreendedor</TableHead>
                                <TableHead>Empreendimento</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Serviços Requeridos</TableHead>
                                <TableHead className="text-right">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading && Array.from({ length: 1 }).map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell colSpan={7}><Skeleton className="h-10 w-full" /></TableCell>
                                </TableRow>
                            ))}
                            {!isLoading && draftRequests.map((item) => (
                                <TableRow key={item.id}>
                                    <TableCell className="font-medium">{getSolicitationNumber(item)}</TableCell>
                                    <TableCell className="text-muted-foreground">{formatDate(item.createdAt)}</TableCell>
                                    <TableCell>{empreendedoresMap.get(item.empreendedorId) || 'N/A'}</TableCell>
                                    <TableCell>{projectsMap.get(item.projectId) || 'N/A'}</TableCell>
                                    <TableCell><Badge variant="outline">{getStatusLabel(item.status)}</Badge></TableCell>
                                    <TableCell className="text-sm text-muted-foreground">{item.services?.join(', ') || 'N/A'}</TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" onClick={() => handleView(item)}><Eye className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent><p>Visualizar detalhes</p></TooltipContent></Tooltip>
                                            {canWrite(user) && (
                                            <>
                                                <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" onClick={() => handleEdit(item)}><Pencil className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent><p>Editar processo</p></TooltipContent></Tooltip>
                                                <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" onClick={() => handleApprove()}><CheckCircle className="h-4 w-4 text-green-500" /></Button></TooltipTrigger><TooltipContent><p>Aprovar Processo</p></TooltipContent></Tooltip>
                                                <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" onClick={() => handleExportPdf()}><FileText className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent><p>Exportar PDF</p></TooltipContent></Tooltip>
                                                <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => openDeleteConfirm(item.id)}><Trash2 className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent><p>Deletar processo</p></TooltipContent></Tooltip>
                                            </>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {!isLoading && draftRequests.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-24 text-center">Nenhuma solicitação em elaboração.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TooltipProvider>
            </CardContent>
          </Card>
          
           <Card>
            <CardHeader>
              <CardTitle>Processos Aprovados/Conclusos</CardTitle>
              <CardDescription>Histórico de processos que já foram finalizados.</CardDescription>
            </CardHeader>
            <CardContent>
             <TooltipProvider>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nº Processo</TableHead>
                    <TableHead>Dt. Criação</TableHead>
                    <TableHead>Empreendedor</TableHead>
                    <TableHead>Empreendimento</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Serviços Requeridos</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                   {isLoading ? (
                    Array.from({ length: 1 }).map((_, i) => (
                        <TableRow key={i}>
                            <TableCell colSpan={7}><Skeleton className="h-10 w-full" /></TableCell>
                        </TableRow>
                    ))
                   ) : approvedRequests.length > 0 ? (
                        approvedRequests.map((item) => (
                            <TableRow key={item.id}>
                                <TableCell className="font-medium">{getSolicitationNumber(item)}</TableCell>
                                <TableCell className="text-muted-foreground">{formatDate(item.createdAt)}</TableCell>
                                <TableCell>{empreendedoresMap.get(item.empreendedorId) || 'N/A'}</TableCell>
                                <TableCell>{projectsMap.get(item.projectId) || 'N/A'}</TableCell>
                                <TableCell><Badge variant="outline">{getStatusLabel(item.status)}</Badge></TableCell>
                                <TableCell className="text-sm text-muted-foreground">{item.services?.join(', ') || 'N/A'}</TableCell>
                                <TableCell className="text-right">
                                    <div className="flex items-center justify-end gap-1">
                                    <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" onClick={() => handleView(item)}><Eye className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent><p>Visualizar detalhes</p></TooltipContent></Tooltip>
                                    <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" onClick={() => handleExportPdf()}><FileText className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent><p>Exportar PDF</p></TooltipContent></Tooltip>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))
                   ) : (
                    <TableRow>
                        <TableCell colSpan={7} className="h-24 text-center">
                            Nenhum processo concluído.
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
        <DialogContent className="sm:max-w-md">
            <DialogHeader>
                <DialogTitle>Detalhes do Processo</DialogTitle>
                <DialogDescription>
                    Visualização dos dados da solicitação.
                </DialogDescription>
            </DialogHeader>
            {viewingItem && (
                <div className="max-h-[60vh] overflow-y-auto pr-4 space-y-4">
                    <DetailItem label="Nº do Processo" value={getSolicitationNumber(viewingItem)} />
                    <DetailItem label="Empreendedor" value={empreendedoresMap.get(viewingItem.empreendedorId)} />
                    <DetailItem label="Empreendimento" value={projectsMap.get(viewingItem.projectId)} />
                    <Separator />
                    <DetailItem label="Serviços Solicitados" value={viewingItem.services} />
                    <Separator />
                    <DetailItem label="Status" value={getStatusLabel(viewingItem.status)} />
                    <DetailItem label="Data de Criação" value={formatDate(viewingItem.createdAt)} />
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
              Esta ação não pode ser desfeita. Isso irá deletar permanentemente a solicitação de processo.
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
