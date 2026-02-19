
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, PlusCircle, FileText, CheckCircle, Eye, Pencil, Trash2 } from 'lucide-react';
import { useCollection, useFirebase, useUser, useMemoFirebase, errorEmitter } from '@/firebase';
import { collection, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import type { RCA } from '@/lib/types';
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';

const DetailItem = ({ label, value }: { label: string, value?: string | null }) => (
    <div className="space-y-1">
        <Label className="text-sm font-medium">{label}</Label>
        <p className="text-sm text-muted-foreground">{value || 'Não informado'}</p>
    </div>
);


export default function RcaPage() {
  const [isGenerateOpen, setIsGenerateOpen] = useState(false);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [itemToGenerate, setItemToGenerate] = useState<RCA | null>(null);
  const [itemToView, setItemToView] = useState<RCA | null>(null);
  const [selectedFormat, setSelectedFormat] = useState<'docx' | 'pdf'>('docx');

  const router = useRouter();
  const { firestore, user } = useFirebase();
  const { toast } = useToast();

  const rcasQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return collection(firestore, 'rcas');
  }, [firestore, user]);

  const { data: rcas, isLoading } = useCollection<RCA>(rcasQuery);
  
  const { draftRcas, approvedRcas } = useMemo(() => {
    if (!rcas) return { draftRcas: [], approvedRcas: [] };
    const drafts = rcas.filter(p => p.status !== 'Aprovado');
    const approved = rcas.filter(p => p.status === 'Aprovado');
    return { draftRcas: drafts, approvedRcas: approved };
  }, [rcas]);

  const handleAddNew = () => {
    router.push('/studies/rca/new');
  };

  const handleEdit = (item: RCA) => {
    router.push(`/studies/rca/${item.id}/edit`);
  };
  
  const handleView = (item: RCA) => {
    setItemToView(item);
    setIsViewOpen(true);
  };
  
  const handleApprove = async (rcaId: string) => {
    if (!firestore) return;
    const docRef = doc(firestore, 'rcas', rcaId);
    try {
        await updateDoc(docRef, { status: 'Aprovado' });
        toast({ title: "RCA Aprovado", description: "O relatório foi movido para a lista de aprovados." });
    } catch (error) {
        console.error("Error approving RCA:", error);
        toast({ variant: "destructive", title: "Erro ao Aprovar", description: "Não foi possível atualizar o status do RCA." });
    }
  };
  
  const handleOpenGenerateDialog = (item: RCA) => {
    setItemToGenerate(item);
    setIsGenerateOpen(true);
  };

  const handleGenerate = () => {
    if (!itemToGenerate) return;
    toast({
      title: "Funcionalidade em desenvolvimento",
      description: `A lógica para gerar o ${selectedFormat.toUpperCase()} para "${itemToGenerate.empreendimento?.nome}" será implementada.`,
    });
    // Lógica para chamar a cloud function virá aqui.
    setIsGenerateOpen(false);
  };

  const openDeleteConfirm = (itemId: string) => {
    setItemToDelete(itemId);
    setIsAlertOpen(true);
  };

  const handleDelete = () => {
    if (!firestore || !itemToDelete) return;
    const docRef = doc(firestore, 'rcas', itemToDelete);
    deleteDoc(docRef)
      .then(() => {
        toast({
          title: 'RCA deletado',
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
  
  const canDelete = (item: RCA) => {
    if(!user) return false;
    if (user.role === 'admin') return true;
    if (item.status === 'Rascunho') return true;
    return false;
  }

  return (
    <>
      <div className="flex flex-col h-full">
        <PageHeader title="Relatórios de Controle Ambiental (RCA)">
          <Button size="sm" className="gap-1" onClick={handleAddNew}>
            <PlusCircle className="h-4 w-4" />
            Adicionar RCA
          </Button>
        </PageHeader>
        <main className="flex-1 overflow-auto p-4 md:p-6 space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Gerenciamento de RCAs</CardTitle>
              <CardDescription>Acompanhe, adicione e edite os relatórios RCA em elaboração.</CardDescription>
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
                      Array.from({ length: 3 }).map((_, i) => (
                        <TableRow key={i}>
                          <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                          <TableCell className="hidden md:table-cell"><Skeleton className="h-5 w-32" /></TableCell>
                          <TableCell className="hidden lg:table-cell"><Skeleton className="h-5 w-24" /></TableCell>
                          <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                          <TableCell className="text-right"><Skeleton className="h-8 w-32" /></TableCell>
                        </TableRow>
                      ))}
                    {!isLoading && draftRcas?.map((item) => (
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
                                <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" onClick={() => handleEdit(item)}><Pencil className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent><p>Editar RCA</p></TooltipContent></Tooltip>
                                <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" onClick={() => handleOpenGenerateDialog(item)}><FileText className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent><p>Gerar Documento</p></TooltipContent></Tooltip>
                                <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" onClick={() => handleApprove(item.id)}><CheckCircle className="h-4 w-4 text-green-500" /></Button></TooltipTrigger><TooltipContent><p>Aprovar RCA</p></TooltipContent></Tooltip>
                                <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => openDeleteConfirm(item.id)} disabled={!canDelete(item)}><Trash2 className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent><p>Deletar RCA</p></TooltipContent></Tooltip>
                            </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {!isLoading && draftRcas.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center">
                          Nenhum RCA em elaboração.
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
              <CardTitle>RCAs Aprovados</CardTitle>
              <CardDescription>Lista de Relatórios de Controle Ambiental que foram finalizados e aprovados.</CardDescription>
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
                    {!isLoading && approvedRcas.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.empreendimento?.nome}</TableCell>
                        <TableCell className="hidden md:table-cell text-muted-foreground">{item.empreendedor?.nome}</TableCell>
                        <TableCell>
                           <Badge variant={'outline'} className={cn('bg-green-500/20 text-green-700')}>
                            {item.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                           <div className="flex items-center justify-end gap-1">
                                <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" onClick={() => handleView(item)}><Eye className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent><p>Visualizar detalhes</p></TooltipContent></Tooltip>
                                <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" onClick={() => handleOpenGenerateDialog(item)}><FileText className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent><p>Gerar Documento</p></TooltipContent></Tooltip>
                                {user?.role === 'admin' && (
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => openDeleteConfirm(item.id)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent><p>Deletar RCA</p></TooltipContent>
                                    </Tooltip>
                                )}
                            </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {!isLoading && approvedRcas.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="h-24 text-center">
                          Nenhum RCA aprovado.
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
            <DialogTitle>{itemToView?.empreendimento?.nome}</DialogTitle>
            <DialogDescription>Detalhes do Relatório de Controle Ambiental.</DialogDescription>
          </DialogHeader>
          {itemToView && (
            <div className="max-h-[60vh] overflow-y-auto pr-4 space-y-4">
              <DetailItem label="Empreendedor" value={itemToView.empreendedor?.nome} />
              <DetailItem label="Empreendimento" value={itemToView.empreendimento?.nome} />
              <Separator />
              <DetailItem label="Atividade Principal" value={itemToView.activity} />
              {itemToView.subActivity && <DetailItem label="Atividade Específica" value={itemToView.subActivity} />}
              <Separator />
              <h4 className="font-semibold text-foreground">Termo de Referência</h4>
              <DetailItem label="Título" value={itemToView.termoReferencia?.titulo} />
              <DetailItem label="Processo" value={itemToView.termoReferencia?.processo} />
            </div>
          )}
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">Fechar</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isGenerateOpen} onOpenChange={setIsGenerateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Gerar Documento</DialogTitle>
            <DialogDescription>
              Selecione o formato para exportar o relatório para <span className="font-semibold">{itemToGenerate?.empreendimento?.nome}</span>.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
              <RadioGroup defaultValue="docx" onValueChange={(value: 'docx' | 'pdf') => setSelectedFormat(value)}>
                  <div className="flex items-center space-x-2">
                      <RadioGroupItem value="docx" id="docx" />
                      <Label htmlFor="docx">Word (.docx)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                      <RadioGroupItem value="pdf" id="pdf" />
                      <Label htmlFor="pdf">PDF</Label>
                  </div>
              </RadioGroup>
          </div>
          <DialogFooter>
            <DialogClose asChild>
                <Button variant="outline">Cancelar</Button>
            </DialogClose>
            <Button onClick={handleGenerate}>
                <FileText className="mr-2 h-4 w-4" />
                Gerar
            </Button>
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
