
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
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
    DialogClose
} from '@/components/ui/dialog';
import { MoreHorizontal, PlusCircle, FileText, Pencil, Trash2, Eye, Upload, CheckCircle, Loader2 } from 'lucide-react';
import { useCollection, useFirebase, useMemoFirebase, errorEmitter, useDoc, useAuth } from '@/firebase';
import { collection, doc, deleteDoc, updateDoc, query, where, getDocs } from 'firebase/firestore';
import * as React from 'react';
import { getStorage, ref, getDownloadURL, uploadBytes } from "firebase/storage";
import { fetchBrandingImageAsBase64 } from '@/lib/branding-pdf';
import { useLocalBranding } from '@/hooks/use-local-branding';
import type { Contract, Client, CompanySettings, AppUser } from '@/lib/types';
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
import { generateContractPdf } from './contract-pdf';
import { ptBR } from 'date-fns/locale';
import { format } from 'date-fns';
import { ContractForm } from './contract-form';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';


const DetailItem = ({ label, value }: { label: string, value?: string | null | number }) => (
    <div className="space-y-1">
        <Label className="text-sm font-medium">{label}</Label>
        <p className="text-sm text-muted-foreground">{value || 'Não informado'}</p>
    </div>
);


export default function ContractsPage() {
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Contract | null>(null);
  const [viewingItem, setViewingItem] = useState<Contract | null>(null);
  const [uploadingItem, setUploadingItem] = useState<Contract | null>(null);
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [filterCliente, setFilterCliente] = useState('');
  const [filterDataInicio, setFilterDataInicio] = useState('');
  const [filterDataFim, setFilterDataFim] = useState('');
  const [filterValorMin, setFilterValorMin] = useState('');
  const [filterValorMax, setFilterValorMax] = useState('');
  const router = useRouter();

  const { user } = useAuth();
  const { firestore } = useFirebase();
  const { toast } = useToast();

  const [clientIdsForUser, setClientIdsForUser] = useState<string[] | null>(null);

  React.useEffect(() => {
    if (!firestore || !user || user.role !== 'client') return;
    const isSelfRegistered = !!(user as any).package;
    if (isSelfRegistered) {
      const cRef = collection(firestore, 'clients');
      const q = query(cRef, where('userId', '==', user.id));
      getDocs(q).then((snap) => setClientIdsForUser(snap.docs.map(d => d.id))).catch(() => setClientIdsForUser([]));
    } else {
      const docs = [user.cpf, ...(user.cnpjs || [])].filter(Boolean) as string[];
      if (docs.length > 0) {
        const cRef = collection(firestore, 'clients');
        const q = query(cRef, where('cpfCnpj', 'in', docs));
        getDocs(q).then((snap) => setClientIdsForUser(snap.docs.map(d => d.id))).catch(() => setClientIdsForUser([]));
      } else {
        setClientIdsForUser([]);
      }
    }
  }, [firestore, user]);

  const contractsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    if (user.role === 'client') {
      if (!clientIdsForUser || clientIdsForUser.length === 0) return null;
      return query(collection(firestore, 'contracts'), where('clientId', 'in', clientIdsForUser));
    }
    return collection(firestore, 'contracts');
  }, [firestore, user, clientIdsForUser]);

  const { data: contracts, isLoading: isLoadingContracts } = useCollection<Contract>(contractsQuery);

  const { data: brandingData } = useLocalBranding();
  
  const handleAddNew = () => {
    setEditingItem(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (item: Contract) => {
    setEditingItem(item);
    setIsDialogOpen(true);
  };

  const handleView = (item: Contract) => {
    setViewingItem(item);
    setIsViewOpen(true);
  }
  
  const handleOpenUpload = (item: Contract) => {
    setUploadingItem(item);
    setIsUploadOpen(true);
    setFileToUpload(null);
  }

  const handleFileUpload = async () => {
    if (!fileToUpload || !uploadingItem || !firestore) return;
    setIsUploading(true);

    try {
        const storage = getStorage();
        const storageRef = ref(storage, `signed-contracts/${uploadingItem.id}/${fileToUpload.name}`);
        await uploadBytes(storageRef, fileToUpload);
        const downloadUrl = await getDownloadURL(storageRef);

        const docRef = doc(firestore, 'contracts', uploadingItem.id);
        await updateDoc(docRef, { fileUrl: downloadUrl });

        toast({ title: "Upload Concluído", description: "O contrato assinado foi anexado com sucesso." });
        setIsUploadOpen(false);
        setFileToUpload(null);

    } catch (error) {
        console.error("Error uploading signed contract:", error);
        toast({ variant: "destructive", title: "Erro no Upload", description: "Não foi possível enviar o arquivo." });
    } finally {
        setIsUploading(false);
    }
  }


  const openDeleteConfirm = (itemId: string) => {
    setItemToDelete(itemId);
    setIsAlertOpen(true);
  };
  
  const handleApprove = async (contractId: string) => {
    if (!firestore) return;
    const docRef = doc(firestore, 'contracts', contractId);
    try {
        await updateDoc(docRef, { status: 'Aprovado' });
        toast({ title: "Contrato Aprovado", description: "O contrato foi movido para a lista de finalizados." });
    } catch (error) {
        console.error("Error approving contract:", error);
        const permissionError = new FirestorePermissionError({
          path: docRef.path,
          operation: 'update',
          requestResourceData: { status: 'Aprovado' }
        });
        errorEmitter.emit('permission-error', permissionError);
    }
  }

  const handleDelete = () => {
    if (!firestore || !itemToDelete) return;
    const docRef = doc(firestore, 'contracts', itemToDelete);
    deleteDoc(docRef)
      .then(() => {
        toast({
          title: 'Contrato deletado',
          description: 'O contrato foi removido com sucesso.',
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

  const handleGeneratePdf = async (contract: Contract) => {
    try {
      await generateContractPdf(contract, brandingData ?? undefined, fetchBrandingImageAsBase64);
      toast({ title: 'PDF gerado', description: 'O contrato foi exportado com todas as cláusulas e assinaturas.' });
    } catch (err) {
      console.error(err);
      toast({
        title: 'Erro ao gerar PDF',
        description: err instanceof Error ? err.message : 'Não foi possível gerar o PDF do contrato.',
        variant: 'destructive',
      });
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return format(new Date(dateString), "dd/MM/yyyy", { locale: ptBR });
  }
  
  const draftContracts = useMemo(() => contracts?.filter(c => c.status !== 'Aprovado'), [contracts]);
  const approvedContracts = useMemo(() => contracts?.filter(c => c.status === 'Aprovado'), [contracts]);

  const applyContractFilters = (list: Contract[]) => {
    return list.filter((c) => {
      const nome = c.contratante?.nome ?? '';
      if (filterCliente.trim() && !nome.toLowerCase().includes(filterCliente.trim().toLowerCase())) return false;
      const dataStr = c.dataContrato?.slice(0, 10) ?? '';
      if (filterDataInicio && dataStr < filterDataInicio) return false;
      if (filterDataFim && dataStr > filterDataFim) return false;
      const valor = c.pagamento?.valorTotal ?? 0;
      const vMin = filterValorMin !== '' ? parseFloat(filterValorMin) : null;
      const vMax = filterValorMax !== '' ? parseFloat(filterValorMax) : null;
      if (vMin != null && !Number.isNaN(vMin) && valor < vMin) return false;
      if (vMax != null && !Number.isNaN(vMax) && valor > vMax) return false;
      return true;
    });
  };
  const filteredDraftContracts = useMemo(() => applyContractFilters(draftContracts ?? []), [draftContracts, filterCliente, filterDataInicio, filterDataFim, filterValorMin, filterValorMax]);
  const filteredApprovedContracts = useMemo(() => applyContractFilters(approvedContracts ?? []), [approvedContracts, filterCliente, filterDataInicio, filterDataFim, filterValorMin, filterValorMax]);

  return (
    <>
      <div className="flex flex-col h-full">
        <PageHeader title="Contratos">
         {user?.role !== 'client' && (
            <Button size="sm" className="gap-1" onClick={handleAddNew}>
                <PlusCircle className="h-4 w-4" />
                Novo Contrato
            </Button>
          )}
        </PageHeader>
        <main className="flex-1 overflow-auto p-4 md:p-6 space-y-8">
          <div className="flex flex-wrap items-end gap-2 p-3 rounded-lg bg-muted/50">
            <Search className="h-4 w-4 text-muted-foreground" />
            <div className="flex flex-wrap items-end gap-2">
              <div>
                <Label className="text-xs">Contratante</Label>
                <Input placeholder="Nome" className="h-8 w-40" value={filterCliente} onChange={(e) => setFilterCliente(e.target.value)} />
              </div>
              <div>
                <Label className="text-xs">Data início</Label>
                <Input type="date" className="h-8 w-36" value={filterDataInicio} onChange={(e) => setFilterDataInicio(e.target.value)} />
              </div>
              <div>
                <Label className="text-xs">Data fim</Label>
                <Input type="date" className="h-8 w-36" value={filterDataFim} onChange={(e) => setFilterDataFim(e.target.value)} />
              </div>
              <div>
                <Label className="text-xs">Valor mín.</Label>
                <Input type="number" placeholder="0" className="h-8 w-24" value={filterValorMin} onChange={(e) => setFilterValorMin(e.target.value)} />
              </div>
              <div>
                <Label className="text-xs">Valor máx.</Label>
                <Input type="number" placeholder="0" className="h-8 w-24" value={filterValorMax} onChange={(e) => setFilterValorMax(e.target.value)} />
              </div>
            </div>
          </div>
          {user?.role !== 'client' && (
            <Card>
                <CardHeader>
                <CardTitle>Gerenciamento de Contratos</CardTitle>
                <CardDescription>Crie, edite e gerencie seus contratos de prestação de serviço.</CardDescription>
                </CardHeader>
                <CardContent>
                <TooltipProvider>
                    <Table>
                    <TableHeader>
                        <TableRow>
                        <TableHead>Contratante</TableHead>
                        <TableHead className="hidden md:table-cell">Objeto</TableHead>
                        <TableHead>Data</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {(isLoadingContracts) &&
                        Array.from({ length: 3 }).map((_, i) => (
                            <TableRow key={i}>
                            <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                            <TableCell className="hidden md:table-cell"><Skeleton className="h-5 w-48" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                            <TableCell><Skeleton className="h-6 w-24 rounded-full" /></TableCell>
                            <TableCell className="text-right"><Skeleton className="h-8 w-32" /></TableCell>
                            </TableRow>
                        ))}
                        {!isLoadingContracts && filteredDraftContracts?.map((item) => (
                        <TableRow key={item.id}>
                            <TableCell className="font-medium">{item.contratante?.nome}</TableCell>
                            <TableCell className="hidden md:table-cell text-muted-foreground max-w-xs truncate">{item.objeto.servicos}</TableCell>
                            <TableCell className="text-muted-foreground">{formatDate(item.dataContrato)}</TableCell>
                            <TableCell><Badge variant="outline">{item.status || 'Rascunho'}</Badge></TableCell>
                            <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                                    <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" onClick={() => handleView(item)}><Eye className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent><p>Visualizar detalhes</p></TooltipContent></Tooltip>
                                    <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" onClick={() => handleEdit(item)}><Pencil className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent><p>Editar contrato</p></TooltipContent></Tooltip>
                                    <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" onClick={() => handleGeneratePdf(item)}><FileText className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent><p>Gerar PDF</p></TooltipContent></Tooltip>
                                    {user?.role === 'admin' && (
                                        <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" onClick={() => handleApprove(item.id)}><CheckCircle className="h-4 w-4 text-green-500" /></Button></TooltipTrigger><TooltipContent><p>Aprovar Contrato</p></TooltipContent></Tooltip>
                                    )}
                                    <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => openDeleteConfirm(item.id)}><Trash2 className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent><p>Deletar contrato</p></TooltipContent></Tooltip>
                                </div>
                            </TableCell>
                        </TableRow>
                        ))}
                        {!isLoadingContracts && filteredDraftContracts?.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={5} className="h-24 text-center">
                            {draftContracts?.length === 0 ? 'Nenhum contrato em gerenciamento.' : 'Nenhum contrato corresponde aos filtros.'}
                            </TableCell>
                        </TableRow>
                        )}
                    </TableBody>
                    </Table>
                </TooltipProvider>
                </CardContent>
            </Card>
           )}
          
           <Card>
            <CardHeader>
              <CardTitle>Contratos Finalizados/Assinados</CardTitle>
              <CardDescription>Visualize contratos aprovados e faça upload da versão assinada.</CardDescription>
            </CardHeader>
            <CardContent>
              <TooltipProvider>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Contratante</TableHead>
                      <TableHead className="hidden md:table-cell">Objeto</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoadingContracts &&
                      Array.from({ length: 1 }).map((_, i) => (
                        <TableRow key={i}>
                           <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                           <TableCell className="hidden md:table-cell"><Skeleton className="h-5 w-48" /></TableCell>
                           <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                           <TableCell className="text-right"><Skeleton className="h-8 w-24" /></TableCell>
                        </TableRow>
                      ))}
                    {!isLoadingContracts && filteredApprovedContracts?.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.contratante?.nome}</TableCell>
                        <TableCell className="hidden md:table-cell text-muted-foreground max-w-xs truncate">{item.objeto.servicos}</TableCell>
                        <TableCell className="text-muted-foreground">{formatDate(item.dataContrato)}</TableCell>
                        <TableCell className="text-right">
                           <div className="flex items-center justify-end gap-1">
                                <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" onClick={() => handleView(item)}><Eye className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent><p>Visualizar detalhes</p></TooltipContent></Tooltip>
                                <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" onClick={() => handleGeneratePdf(item)}><FileText className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent><p>Gerar PDF</p></TooltipContent></Tooltip>
                                {item.fileUrl ? (
                                    <Tooltip><TooltipTrigger asChild><Button asChild variant="ghost" size="icon"><a href={item.fileUrl} target="_blank" rel="noopener noreferrer"><FileText className="h-4 w-4 text-blue-500"/></a></Button></TooltipTrigger><TooltipContent><p>Ver Contrato Assinado</p></TooltipContent></Tooltip>
                                ) : user?.role !== 'client' ? (
                                    <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" onClick={() => handleOpenUpload(item)}><Upload className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent><p>Upload Contrato Assinado</p></TooltipContent></Tooltip>
                                ) : null}
                                {(user?.role === 'admin' || user?.role === 'supervisor') && (
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => openDeleteConfirm(item.id)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent><p>Deletar contrato</p></TooltipContent>
                                    </Tooltip>
                                )}
                            </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {!isLoadingContracts && filteredApprovedContracts?.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="h-24 text-center">
                          {approvedContracts?.length === 0 ? 'Nenhum contrato finalizado.' : 'Nenhum contrato corresponde aos filtros.'}
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

       <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-4xl h-full max-h-[90dvh] flex flex-col">
            <ContractForm currentItem={editingItem} onSuccess={() => setIsDialogOpen(false)} />
        </DialogContent>
      </Dialog>
      
       <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload de Contrato Assinado</DialogTitle>
            <DialogDescription>
              Anexe o arquivo PDF do contrato assinado para {uploadingItem?.contratante.nome}.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-2">
            <Label htmlFor="signed-contract-file">Arquivo do Contrato (PDF)</Label>
            <Input id="signed-contract-file" type="file" accept="application/pdf" onChange={(e) => setFileToUpload(e.target.files?.[0] || null)} disabled={isUploading} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUploadOpen(false)} disabled={isUploading}>Cancelar</Button>
            <Button onClick={handleFileUpload} disabled={!fileToUpload || isUploading}>
                {isUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                {isUploading ? "Enviando..." : "Enviar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
                <DialogTitle>Detalhes do Contrato</DialogTitle>
                <DialogDescription>
                    Visualização do contrato com {viewingItem?.contratante.nome}.
                </DialogDescription>
            </DialogHeader>
            {viewingItem && (
                <div className="max-h-[60vh] overflow-y-auto pr-4 space-y-4">
                    <h4 className="font-semibold text-foreground">Contratante</h4>
                    <DetailItem label="Nome" value={viewingItem.contratante.nome} />
                    <DetailItem label="CPF/CNPJ" value={viewingItem.contratante.cpfCnpj} />
                    <DetailItem label="Endereço" value={`${viewingItem.contratante.endereco || ''}, ${viewingItem.contratante.numero || ''}`} />
                    <Separator />

                    <h4 className="font-semibold text-foreground">Contratado</h4>
                    <DetailItem label="Nome" value={viewingItem.contratado.name} />
                    <DetailItem label="CNPJ" value={viewingItem.contratado.cnpj} />
                    <Separator />
                    
                    <h4 className="font-semibold text-foreground">Responsável Técnico</h4>
                    <DetailItem label="Nome" value={viewingItem.responsavelTecnico.name} />
                    <DetailItem label="Profissão" value={viewingItem.responsavelTecnico.profession} />
                     <Separator />

                    <h4 className="font-semibold text-foreground">Objeto</h4>
                    <DetailItem label="Empreendimento" value={viewingItem.objeto.empreendimento} />
                    <p className="text-sm font-medium">Serviços</p>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{viewingItem.objeto.servicos}</p>
                    {viewingItem.objeto.itens && viewingItem.objeto.itens.length > 0 && (
                        <div>
                             <p className="text-sm font-medium mb-2">Itens de Serviço:</p>
                             <ul className="list-disc pl-5 text-sm text-muted-foreground">
                                {viewingItem.objeto.itens.map((item, index) => (
                                    <li key={index}>{item.descricao} - {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.valor)}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                    <Separator />

                    <h4 className="font-semibold text-foreground">Pagamento</h4>
                    <DetailItem label="Valor Total" value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(viewingItem.pagamento.valorTotal)} />
                    <DetailItem label="Valor por Extenso" value={viewingItem.pagamento.valorExtenso} />
                    <DetailItem label="Forma de Pagamento" value={viewingItem.pagamento.forma} />

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
              Esta ação não pode ser desfeita. Isso irá deletar permanentemente o contrato.
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
