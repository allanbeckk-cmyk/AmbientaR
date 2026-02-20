
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
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, PlusCircle, Pencil, Trash2, Eye, FileText, CheckCircle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCollection, useFirebase, useMemoFirebase, errorEmitter, useDoc, useAuth } from '@/firebase';
import { collection, doc, deleteDoc, query, where, updateDoc } from 'firebase/firestore';
import { fetchBrandingImageAsBase64 } from '@/lib/branding-pdf';
import { useLocalBranding } from '@/hooks/use-local-branding';
import type { Proposal, Client, CompanySettings, Contract } from '@/lib/types';
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
import jsPDF from 'jspdf';
import { logUserAction } from '@/lib/audit-log';
import { ProposalForm } from './proposal-form';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';

const DetailItem = ({ label, value }: { label: string, value?: string | null | number }) => (
    <div className="space-y-1">
        <Label className="text-sm font-medium">{label}</Label>
        <p className="text-sm text-muted-foreground">{value || 'Não informado'}</p>
    </div>
);


export default function ProposalsPage() {
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isViewOpen, setIsViewOpen] = useState(false);
    const [isAlertOpen, setIsAlertOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<string | null>(null);
    const [editingItem, setEditingItem] = useState<Proposal | null>(null);
    const [viewingItem, setViewingItem] = useState<Proposal | null>(null);
    const router = useRouter();

    const { firestore, auth, user } = useFirebase();
    const { toast } = useToast();

    const proposalsQuery = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return collection(firestore, 'proposals');
    }, [firestore, user]);

    const { data: proposals, isLoading: isLoadingProposals } = useCollection<Proposal>(proposalsQuery);
    
    const clientsQuery = useMemoFirebase(() => firestore ? collection(firestore, 'clients') : null, [firestore]);
    const { data: clients, isLoading: isLoadingClients } = useCollection<Client>(clientsQuery);
    const clientsMap = useMemo(() => new Map(clients?.map(c => [c.id, c])), [clients]);

    const contractsQuery = useMemoFirebase(() => firestore ? collection(firestore, 'contracts') : null, [firestore]);
    const { data: contracts, isLoading: isLoadingContracts } = useCollection<Contract>(contractsQuery);
    const contractsMap = useMemo(() => new Map(contracts?.map(c => [c.id, c])), [contracts]);


    const { data: brandingData, isLoading: isLoadingBranding } = useLocalBranding();

    const isLoading = isLoadingProposals || isLoadingClients || isLoadingBranding || isLoadingContracts;

    const { activeProposals, finalizedProposals } = useMemo(() => {
        if (!proposals) return { activeProposals: [], finalizedProposals: [] };
        
        const active = proposals
            .filter(p => p.status === 'Draft' || p.status === 'Sent')
            .sort((a, b) => b.proposalNumber.localeCompare(a.proposalNumber, undefined, { numeric: true, sensitivity: 'base' }));
        
        const finalized = proposals
            .filter(p => p.status === 'Accepted' || p.status === 'Rejected')
            .sort((a, b) => b.proposalNumber.localeCompare(a.proposalNumber, undefined, { numeric: true, sensitivity: 'base' }));

        return { activeProposals: active, finalizedProposals: finalized };
    }, [proposals]);
    
    const handleAddNew = () => {
        setEditingItem(null);
        setIsFormOpen(true);
    };

    const handleEdit = (item: Proposal) => {
        setEditingItem(item);
        setIsFormOpen(true);
    };
    
    const handleView = (item: Proposal) => {
        setViewingItem(item);
        setIsViewOpen(true);
    };


    const openDeleteConfirm = (itemId: string) => {
        setItemToDelete(itemId);
        setIsAlertOpen(true);
    };

    const handleUpdateStatus = async (proposalId: string, status: 'Accepted' | 'Rejected') => {
        if (!firestore) return;
        const docRef = doc(firestore, 'proposals', proposalId);
        try {
            await updateDoc(docRef, { status });
            toast({ title: `Orçamento ${status === 'Accepted' ? 'Aceito' : 'Rejeitado'}`, description: "O status do orçamento foi atualizado." });
        } catch (error) {
            console.error(`Error updating proposal status:`, error);
            const permissionError = new FirestorePermissionError({ path: docRef.path, operation: 'update', requestResourceData: { status } });
            errorEmitter.emit('permission-error', permissionError);
        }
    };


    const handleDelete = () => {
        if (!firestore || !auth || !itemToDelete) return;
        
        const docRef = doc(firestore, 'proposals', itemToDelete);
        const deletedItem = proposals?.find(p => p.id === itemToDelete);

        deleteDoc(docRef)
        .then(() => {
            toast({
            title: 'Orçamento deletado',
            description: 'O orçamento foi removido com sucesso.',
            });
             if(deletedItem) {
                logUserAction(firestore, auth, 'delete_proposal', { proposalId: itemToDelete, proposalNumber: deletedItem.proposalNumber });
            }
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

    const handleExportPdf = async (proposal: Proposal) => {
        const client = clientsMap.get(proposal.clientId);
        const contract = proposal.contractId ? contractsMap.get(proposal.contractId) : null;
        const doc = new jsPDF({ unit: 'mm', format: 'a4' });
        
        const headerBase64 = await fetchBrandingImageAsBase64(brandingData?.headerImageUrl);
        const footerBase64 = await fetchBrandingImageAsBase64(brandingData?.footerImageUrl);
        const watermarkBase64 = await fetchBrandingImageAsBase64(brandingData?.watermarkImageUrl);

        const pageHeight = doc.internal.pageSize.getHeight();
        const pageWidth = doc.internal.pageSize.getWidth();
        const margins = { top: 15, bottom: 25, left: 15, right: 15 };
        const contentWidth = pageWidth - margins.left - margins.right;

        // Header: alinhado à esquerda, tamanho natural (sem esticar)
        if (headerBase64) {
            const imgProps = doc.getImageProperties(headerBase64);
            const aspectRatio = imgProps.width / imgProps.height;
            const headerHeight = 25; // altura fixa em mm; largura proporcional
            const headerWidth = headerHeight * aspectRatio;
            doc.addImage(headerBase64, 'PNG', margins.left, 10, headerWidth, headerHeight, undefined, 'FAST');
        }

        let yPos = headerBase64 ? 45 : 22;

        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.text(`Orçamento #${proposal.proposalNumber}`, 105, yPos, { align: 'center' });
        yPos += 10;
        
        doc.setFontSize(10);
        doc.text(`Data: ${new Date(proposal.proposalDate).toLocaleDateString('pt-BR')}`, 14, yPos);
        yPos += 6;
        doc.text(`Válido até: ${new Date(proposal.validUntilDate).toLocaleDateString('pt-BR')}`, 14, yPos);
        yPos += 12;

        if (client) {
            doc.setFontSize(12);
            doc.setFont('Helvetica', 'bold');
            doc.text('Cliente:', 14, yPos, { align: 'justify'});
            doc.setFont('Helvetica', 'normal');
            doc.setFontSize(10);
            yPos += 6;
            doc.text(client.name, 14, yPos, { align: 'justify'});
            yPos += 6;
            doc.text(client.cpfCnpj || '', 14, yPos, { align: 'justify'});
            yPos += 6;
            doc.text(client.email, 14, yPos, { align: 'justify'});
            yPos += 10;
        }

        doc.setFontSize(12);
        doc.setFont('Helvetica', 'bold');
        doc.text('Serviços Propostos:', 14, yPos);
        yPos += 8;
        
        doc.setFontSize(10);
        doc.setFont('Helvetica', 'normal');

        (proposal.items || []).forEach(item => {
            const splitDescription = doc.splitTextToSize(item.description, 130);
            doc.text(splitDescription, 14, yPos, { align: 'justify' });
            doc.text(formatCurrency(item.value), 196, yPos, { align: 'right' });
            yPos += (splitDescription.length * 5) + 4;
        });

        yPos += 6;
        doc.setLineWidth(0.5);
        doc.line(14, yPos - 4, 196, yPos - 4);

        doc.setFontSize(12);
        doc.setFont('Helvetica', 'bold');
        doc.text('Valor Total:', 150, yPos, { align: 'right' });
        doc.text(formatCurrency(proposal.amount), 196, yPos, { align: 'right' });

        yPos += 15;

        doc.setFontSize(10);
        doc.setFont('Helvetica', 'bold');
        doc.text('Status:', 14, yPos);
        doc.setFont('Helvetica', 'normal');
        doc.text(proposal.status, 30, yPos);
        
        if (proposal.fileUrl) {
            yPos += 10;
            doc.textWithLink('Ver Anexo', 14, yPos, { url: proposal.fileUrl });
        }

        // Marca d'água e rodapé em todas as páginas
        const totalPages = doc.getNumberOfPages();
        if (watermarkBase64) {
            const imgProps = doc.getImageProperties(watermarkBase64);
            const aspectRatio = imgProps.width / imgProps.height;
            const watermarkWidth = 100;
            const watermarkHeight = watermarkWidth / aspectRatio;
            const wX = (pageWidth - watermarkWidth) / 2;
            const wY = (pageHeight - watermarkHeight) / 2;
            for (let i = 1; i <= totalPages; i++) {
                doc.setPage(i);
                doc.addImage(watermarkBase64, 'PNG', wX, wY, watermarkWidth, watermarkHeight, undefined, 'FAST');
            }
        }
        if (footerBase64) {
            for (let i = 1; i <= totalPages; i++) {
                doc.setPage(i);
                doc.addImage(footerBase64, 'PNG', 10, pageHeight - 20, pageWidth - 20, 15);
            }
        }

        doc.save(`orcamento_${proposal.proposalNumber}.pdf`);
    };


    const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);

  const getStatusVariant = (status: Proposal['status']) => {
    switch (status) {
      case 'Accepted':
        return 'bg-emerald-500/20 text-emerald-700 border-emerald-500/30';
      case 'Sent':
        return 'bg-blue-500/20 text-blue-700 border-blue-500/30';
      case 'Rejected':
        return 'bg-red-500/20 text-red-700 border-red-500/30';
      default: // Draft
        return 'bg-slate-500/20 text-slate-700 border-slate-500/30';
    }
  };


  return (
    <>
        <div className="flex flex-col h-full">
        <PageHeader title="Orçamentos">
            <Button size="sm" className="gap-1" onClick={handleAddNew}>
            <PlusCircle className="h-4 w-4" />
            Criar Orçamento
            </Button>
        </PageHeader>
        <main className="flex-1 overflow-auto p-4 md:p-6 space-y-8">
            <Card>
            <CardHeader>
                <CardTitle>Gerenciamento de Orçamentos</CardTitle>
                <CardDescription>Crie, edite e gerencie seus orçamentos. Ações para Aceitar ou Rejeitar movem o orçamento para a lista de finalizados.</CardDescription>
            </CardHeader>
            <CardContent>
              <TooltipProvider>
                <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead>Orçamento #</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead className="hidden md:table-cell">Data</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {isLoading && Array.from({ length: 3 }).map((_, i) => (
                        <TableRow key={i}>
                            <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                            <TableCell className="hidden md:table-cell"><Skeleton className="h-5 w-20" /></TableCell>
                            <TableCell className="text-right"><Skeleton className="h-5 w-16 ml-auto" /></TableCell>
                            <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                            <TableCell className="text-right"><Skeleton className="h-8 w-40 ml-auto" /></TableCell>
                        </TableRow>
                    ))}
                    {!isLoading && activeProposals?.map((proposal) => (
                    <TableRow key={proposal.id}>
                        <TableCell className="font-medium">{proposal.proposalNumber}</TableCell>
                        <TableCell>{clientsMap.get(proposal.clientId)?.name || 'Cliente não encontrado'}</TableCell>
                        <TableCell className="hidden md:table-cell text-muted-foreground">{new Date(proposal.proposalDate).toLocaleDateString('pt-BR')}</TableCell>
                        <TableCell className="text-right">{formatCurrency(proposal.amount)}</TableCell>
                        <TableCell>
                        <Badge
                            variant={'outline'}
                            className={cn(getStatusVariant(proposal.status))}
                        >
                            {proposal.status}
                        </Badge>
                        </TableCell>
                        <TableCell>
                            <div className="flex items-center justify-end gap-1">
                                <Tooltip>
                                    <TooltipTrigger asChild><Button variant="ghost" size="icon" onClick={() => handleView(proposal)}><Eye className="h-4 w-4" /></Button></TooltipTrigger>
                                    <TooltipContent><p>Visualizar</p></TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                    <TooltipTrigger asChild><Button variant="ghost" size="icon" onClick={() => handleEdit(proposal)}><Pencil className="h-4 w-4" /></Button></TooltipTrigger>
                                    <TooltipContent><p>Editar</p></TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                    <TooltipTrigger asChild><Button variant="ghost" size="icon" onClick={() => handleExportPdf(proposal)}><FileText className="h-4 w-4" /></Button></TooltipTrigger>
                                    <TooltipContent><p>Exportar PDF</p></TooltipContent>
                                </Tooltip>
                                <DropdownMenu>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                                            </DropdownMenuTrigger>
                                        </TooltipTrigger>
                                        <TooltipContent><p>Mais Ações</p></TooltipContent>
                                    </Tooltip>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuLabel>Marcar Como</DropdownMenuLabel>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onClick={() => handleUpdateStatus(proposal.id, 'Accepted')}><CheckCircle className="mr-2 h-4 w-4 text-green-500" />Aceito</DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleUpdateStatus(proposal.id, 'Rejected')}><XCircle className="mr-2 h-4 w-4 text-red-500" />Rejeitado</DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem className="text-destructive" onClick={() => openDeleteConfirm(proposal.id)}>Deletar</DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </TableCell>
                    </TableRow>
                    ))}
                    {!isLoading && activeProposals?.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={6} className="h-24 text-center">
                                Nenhum orçamento em andamento.
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
                <CardTitle>Orçamentos Finalizados</CardTitle>
                <CardDescription>Lista de orçamentos que foram aceitos ou rejeitados.</CardDescription>
            </CardHeader>
            <CardContent>
              <TooltipProvider>
                <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead>Orçamento #</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead className="hidden md:table-cell">Data</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {isLoading && Array.from({ length: 2 }).map((_, i) => (
                        <TableRow key={i}>
                            <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                            <TableCell className="hidden md:table-cell"><Skeleton className="h-5 w-20" /></TableCell>
                            <TableCell className="text-right"><Skeleton className="h-5 w-16 ml-auto" /></TableCell>
                            <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                            <TableCell className="text-right"><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
                        </TableRow>
                    ))}
                    {!isLoading && finalizedProposals?.map((proposal) => (
                    <TableRow key={proposal.id}>
                        <TableCell className="font-medium">{proposal.proposalNumber}</TableCell>
                        <TableCell>{clientsMap.get(proposal.clientId)?.name || 'Cliente não encontrado'}</TableCell>
                        <TableCell className="hidden md:table-cell text-muted-foreground">{new Date(proposal.proposalDate).toLocaleDateString('pt-BR')}</TableCell>
                        <TableCell className="text-right">{formatCurrency(proposal.amount)}</TableCell>
                        <TableCell>
                        <Badge
                            variant={'outline'}
                            className={cn(getStatusVariant(proposal.status))}
                        >
                            {proposal.status}
                        </Badge>
                        </TableCell>
                        <TableCell>
                            <div className="flex items-center justify-end gap-1">
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button variant="ghost" size="icon" onClick={() => handleView(proposal)}>
                                            <Eye className="h-4 w-4" />
                                            <span className="sr-only">Visualizar</span>
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent><p>Visualizar Detalhes</p></TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button variant="ghost" size="icon" onClick={() => handleExportPdf(proposal)}>
                                            <FileText className="h-4 w-4" />
                                            <span className="sr-only">Exportar</span>
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent><p>Exportar PDF</p></TooltipContent>
                                </Tooltip>
                                {user?.role === 'admin' && (
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => openDeleteConfirm(proposal.id)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent><p>Deletar Orçamento</p></TooltipContent>
                                    </Tooltip>
                                )}
                            </div>
                        </TableCell>
                    </TableRow>
                    ))}
                    {!isLoading && finalizedProposals?.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={6} className="h-24 text-center">
                                Nenhum orçamento finalizado.
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

        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogContent className="sm:max-w-3xl h-full max-h-[90dvh] flex flex-col">
                <ProposalForm currentItem={editingItem} onSuccess={() => setIsFormOpen(false)} />
            </DialogContent>
        </Dialog>
        
        <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
            <DialogContent className="sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle>Detalhes do Orçamento #{viewingItem?.proposalNumber}</DialogTitle>
                    <DialogDescription>
                        Visualização dos dados cadastrados para o orçamento.
                    </DialogDescription>
                </DialogHeader>
                {viewingItem && (
                    <div className="max-h-[60vh] overflow-y-auto pr-4 space-y-4">
                        <DetailItem label="Cliente" value={clientsMap.get(viewingItem.clientId)?.name} />
                        <DetailItem label="Empreendimento" value={viewingItem.empreendimento} />
                        <Separator />
                        <div className="grid grid-cols-2 gap-4">
                           <DetailItem label="Data de Emissão" value={new Date(viewingItem.proposalDate).toLocaleDateString('pt-BR')} />
                           <DetailItem label="Válido Até" value={new Date(viewingItem.validUntilDate).toLocaleDateString('pt-BR')} />
                        </div>
                        <DetailItem label="Status" value={viewingItem.status} />
                         <Separator />
                        <div className="space-y-2">
                            <Label className="text-sm font-medium">Itens de Serviço</Label>
                            <ul className="list-disc pl-5 text-sm text-muted-foreground">
                                {viewingItem.items.map((item, index) => (
                                    <li key={index}>{item.description} - {formatCurrency(item.value)}</li>
                                ))}
                            </ul>
                        </div>
                         <Separator />
                         <div className="flex justify-end font-semibold text-lg">
                            <DetailItem label="Valor Total" value={formatCurrency(viewingItem.amount)} />
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
                        Esta ação não pode ser desfeita. Isso irá deletar permanentemente o orçamento.
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
