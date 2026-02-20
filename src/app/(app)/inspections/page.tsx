
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { MoreHorizontal, PlusCircle, AlertCircle, Eye, Pencil, Trash2, CheckCircle, FileText, Download } from 'lucide-react';
import { useCollection, useFirebase, useMemoFirebase, errorEmitter, useDoc } from '@/firebase';
import { collection, deleteDoc, doc, updateDoc, getDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import type { Inspection, Empreendedor, Project, AppUser, CompanySettings } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { FirestorePermissionError } from '@/firebase/errors';
import { fetchBrandingImageAsBase64 } from '@/lib/branding-pdf';
import { useLocalBranding } from '@/hooks/use-local-branding';


const DetailItem = ({ label, value }: { label: string, value?: string | null }) => (
    <div className="space-y-1">
        <Label className="text-sm font-medium">{label}</Label>
        <p className="text-sm text-muted-foreground">{value || 'Não informado'}</p>
    </div>
);

export default function InspectionsListPage() {
  const [isAlertOpen, setIsAlertOpen] = React.useState(false);
  const [isViewOpen, setIsViewOpen] = React.useState(false);
  const [itemToDelete, setItemToDelete] = React.useState<string | null>(null);
  const [viewingItem, setViewingItem] = React.useState<Inspection | null>(null);
  const router = useRouter();
  const { firestore, user } = useFirebase();
  const { toast } = useToast();

  const inspectionsQuery = useMemoFirebase(() => firestore ? collection(firestore, 'inspections') : null, [firestore]);
  const { data: inspections, isLoading: isLoadingInspections } = useCollection<Inspection>(inspectionsQuery);

  const empreendedoresQuery = useMemoFirebase(() => firestore ? collection(firestore, 'empreendedores') : null, [firestore]);
  const { data: empreendedores, isLoading: isLoadingEmpreendedores } = useCollection<Empreendedor>(empreendedoresQuery);
  const empreendedoresMap = React.useMemo(() => new Map(empreendedores?.map(e => [e.id, e.name])), [empreendedores]);

  const projectsQuery = useMemoFirebase(() => firestore ? collection(firestore, 'projects') : null, [firestore]);
  const { data: projects, isLoading: isLoadingProjects } = useCollection<Project>(projectsQuery);
  const projectsMap = React.useMemo(() => new Map(projects?.map(p => [p.id, { name: p.propertyName, userId: p.userId }])), [projects]);
  
  const { data: brandingData } = useLocalBranding();

  const { draftInspections, approvedInspections } = React.useMemo(() => {
    if (!inspections) return { draftInspections: [], approvedInspections: [] };
    const drafts = inspections.filter(p => p.status !== 'Aprovada');
    const approved = inspections.filter(p => p.status === 'Aprovada');
    return { draftInspections: drafts, approvedInspections: approved };
  }, [inspections]);

  const isLoading = isLoadingInspections || isLoadingEmpreendedores || isLoadingProjects;

  const handleAddNew = () => {
    router.push('/inspections/new');
  };
  
  const handleView = (item: Inspection) => {
    setViewingItem(item);
    setIsViewOpen(true);
  };
  
  const handleApprove = async (itemId: string) => {
    if (!firestore) return;
    const docRef = doc(firestore, 'inspections', itemId);
    try {
        const inspectionDoc = await getDoc(docRef);
        if (!inspectionDoc.exists()) throw new Error("Vistoria não encontrada");
        const inspectionData = inspectionDoc.data() as Inspection;

        await updateDoc(docRef, { status: 'Aprovada' });

        const projectInfo = projectsMap.get(inspectionData.projectId);
        if (projectInfo?.userId) {
            const notificationsRef = collection(firestore, `users/${projectInfo.userId}/notifications`);
            await addDoc(notificationsRef, {
                userId: projectInfo.userId,
                title: 'Novo Relatório de Vistoria',
                description: `O relatório para o empreendimento "${projectInfo.name}" foi aprovado e está disponível.`,
                link: '/inspections/reports',
                isRead: false,
                createdAt: serverTimestamp(),
            });
        }

        toast({ title: "Vistoria Aprovada", description: "O registro foi movido para a lista de aprovados e o cliente notificado." });
    } catch (error) {
        console.error("Error approving inspection:", error);
        toast({ variant: "destructive", title: "Erro ao Aprovar", description: "Não foi possível atualizar o status da vistoria." });
    }
  };


  const openDeleteConfirm = (itemId: string) => {
    setItemToDelete(itemId);
    setIsAlertOpen(true);
  };

  const handleDelete = async () => {
    if (!firestore || !itemToDelete) return;
    const docRef = doc(firestore, 'inspections', itemToDelete);
    try {
      await deleteDoc(docRef);
      toast({ title: 'Vistoria deletada', description: 'O registro da vistoria foi removido com sucesso.' });
    } catch (error) {
      console.error('Error deleting inspection:', error);
      toast({ variant: 'destructive', title: 'Erro ao deletar', description: 'Não foi possível remover o registro.' });
    } finally {
      setIsAlertOpen(false);
      setItemToDelete(null);
    }
  };
  
    const handleGeneratePdf = async (report: Inspection) => {
        toast({ title: "Gerando PDF...", description: "Por favor, aguarde." });

        const doc = new jsPDF();
        const pageHeight = doc.internal.pageSize.getHeight();
        const pageWidth = doc.internal.pageSize.getWidth();
        let yPos = 15;

        const headerBase64 = await fetchBrandingImageAsBase64(brandingData?.headerImageUrl);
        const footerBase64 = await fetchBrandingImageAsBase64(brandingData?.footerImageUrl);
        
        if (headerBase64) {
            doc.addImage(headerBase64, 'PNG', 10, 10, pageWidth - 20, 25);
            yPos = 40;
        }

        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('Relatório de Vistoria de Campo', pageWidth / 2, yPos, { align: 'center' });
        yPos += 15;

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`Empreendimento: ${projectsMap.get(report.projectId)?.name || 'N/A'}`, 15, yPos);
        yPos += 6;
        doc.text(`Empreendedor: ${empreendedoresMap.get(report.empreendedorId) || 'N/A'}`, 15, yPos);
        yPos += 6;
        doc.text(`Data da Vistoria: ${new Date(report.inspectionDate).toLocaleDateString('pt-BR')}`, 15, yPos);
        yPos += 6;
        doc.text(`Responsável: ${report.inspectorName}`, 15, yPos);
        yPos += 12;

        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Inconformidades e Observações', 15, yPos);
        yPos += 6;

        const tableData = report.inconformidades.map(item => [item.description, item.criticality]);

        autoTable(doc, {
            startY: yPos,
            head: [['Descrição', 'Criticidade']],
            body: tableData,
            theme: 'striped',
            headStyles: { fillColor: [34, 139, 34] },
            didDrawPage: (data) => {
                yPos = data.cursor?.y || 0;
            }
        });
        
        yPos = (doc as any).lastAutoTable.finalY + 10;
        
        if(report.accompaniedBy || report.signatureUrl) {
            if (yPos > pageHeight - 50) {
              doc.addPage();
              yPos = 15;
            }
            
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text('Confirmação do Acompanhante', 15, yPos);
            yPos += 8;

            if(report.accompaniedBy) {
                doc.setFontSize(10);
                doc.setFont('helvetica', 'normal');
                doc.text(`Nome: ${report.accompaniedBy}`, 15, yPos);
                yPos += 8;
            }

            if(report.signatureUrl) {
                const signatureBase64 = await fetchBrandingImageAsBase64(report.signatureUrl);
                if(signatureBase64) {
                    try {
                        doc.addImage(signatureBase64, 'PNG', 15, yPos, 60, 30);
                    } catch(e) {
                         console.error("Error adding signature image to PDF", e);
                    }
                }
            }
        }
        
        if (footerBase64) {
            const totalPages = doc.getNumberOfPages();
            for (let i = 1; i <= totalPages; i++) {
                doc.setPage(i);
                doc.addImage(footerBase64, 'PNG', 10, pageHeight - 25, pageWidth - 20, 15);
            }
        }
        
        const fileName = `Relatorio_Vistoria_${projectsMap.get(report.projectId)?.name?.replace(/\s+/g, '_') || 'desconhecido'}.pdf`;
        doc.save(fileName);
    }


  const getHighestCriticality = (inspection: Inspection) => {
    if (!inspection.inconformidades || inspection.inconformidades.length === 0) return 'Baixa';
    const levels = { 'Baixa': 1, 'Média': 2, 'Alta': 3, 'Urgente': 4 };
    const highestLevel = Math.max(...inspection.inconformidades.map(i => levels[i.criticality] || 1));
    return Object.keys(levels).find(key => levels[key as keyof typeof levels] === highestLevel) as Inspection['inconformidades'][0]['criticality'];
  }
  
  const getCriticalityVariant = (criticality: Inspection['inconformidades'][0]['criticality']) => {
    switch (criticality) {
      case 'Baixa': return 'bg-blue-500/20 text-blue-700 border-blue-500/30';
      case 'Média': return 'bg-yellow-500/20 text-yellow-700 border-yellow-500/30';
      case 'Alta': return 'bg-orange-500/20 text-orange-700 border-orange-500/30';
      case 'Urgente': return 'bg-red-500/20 text-red-700 border-red-500/30';
      default: return 'bg-slate-500/20 text-slate-700 border-slate-500/30';
    }
  };


  return (
    <>
      <div className="flex flex-col h-full">
        <PageHeader title="Fiscalização e Vistorias">
          <Button size="sm" className="gap-1" onClick={handleAddNew}>
            <PlusCircle className="h-4 w-4" />
            Nova Vistoria
          </Button>
        </PageHeader>
        <main className="flex-1 overflow-auto p-4 md:p-6 space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Registros de Vistorias</CardTitle>
              <CardDescription>
                Visualize, gerencie e aprove novas vistorias de campo.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TooltipProvider>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Empreendimento</TableHead>
                      <TableHead className="hidden md:table-cell">Data</TableHead>
                      <TableHead>Criticidade Máxima</TableHead>
                      <TableHead>Nº de Inconformidades</TableHead>
                      <TableHead className="hidden lg:table-cell">Responsável</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      Array.from({ length: 3 }).map((_, i) => (
                        <TableRow key={i}>
                          <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                          <TableCell className="hidden md:table-cell"><Skeleton className="h-5 w-24" /></TableCell>
                          <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                          <TableCell><Skeleton className="h-5 w-8" /></TableCell>
                          <TableCell className="hidden lg:table-cell"><Skeleton className="h-5 w-32" /></TableCell>
                          <TableCell className="text-right"><Skeleton className="h-8 w-40 ml-auto" /></TableCell>
                        </TableRow>
                      ))
                    ) : draftInspections && draftInspections.length > 0 ? (
                        draftInspections.map((inspection) => {
                        const highestCriticality = getHighestCriticality(inspection);
                        return (
                        <TableRow key={inspection.id}>
                          <TableCell className="font-medium">{projectsMap.get(inspection.projectId)?.name || 'Projeto não encontrado'}</TableCell>
                          <TableCell className="hidden md:table-cell text-muted-foreground">{new Date(inspection.inspectionDate).toLocaleDateString('pt-BR')}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={cn(getCriticalityVariant(highestCriticality))}>
                              <AlertCircle className="mr-1 h-3 w-3" />
                              {highestCriticality}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">{inspection.inconformidades?.length || 0}</TableCell>
                          <TableCell className="hidden lg:table-cell text-muted-foreground">{inspection.inspectorName}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                                <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" onClick={() => handleView(inspection)}><Eye className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent><p>Visualizar detalhes</p></TooltipContent></Tooltip>
                                <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" onClick={() => handleGeneratePdf(inspection)}><FileText className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent><p>Exportar PDF</p></TooltipContent></Tooltip>
                                <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" onClick={() => handleApprove(inspection.id)}><CheckCircle className="h-4 w-4 text-green-500" /></Button></TooltipTrigger><TooltipContent><p>Aprovar Vistoria</p></TooltipContent></Tooltip>
                                <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => openDeleteConfirm(inspection.id)}><Trash2 className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent><p>Deletar vistoria</p></TooltipContent></Tooltip>
                            </div>
                          </TableCell>
                        </TableRow>
                        )
                      })
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="h-24 text-center">
                          Nenhum registro de vistoria em aberto.
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
              <CardTitle>Vistorias Aprovadas</CardTitle>
              <CardDescription>
                Histórico de vistorias que já foram revisadas e aprovadas.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TooltipProvider>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Empreendimento</TableHead>
                      <TableHead className="hidden md:table-cell">Data</TableHead>
                      <TableHead>Responsável</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow><TableCell colSpan={4}><Skeleton className="h-10 w-full" /></TableCell></TableRow>
                    ) : approvedInspections && approvedInspections.length > 0 ? (
                      approvedInspections.map((inspection) => (
                        <TableRow key={inspection.id}>
                          <TableCell className="font-medium">{projectsMap.get(inspection.projectId)?.name || 'Projeto não encontrado'}</TableCell>
                          <TableCell className="hidden md:table-cell text-muted-foreground">{new Date(inspection.inspectionDate).toLocaleDateString('pt-BR')}</TableCell>
                          <TableCell className="text-muted-foreground">{inspection.inspectorName}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                                <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" onClick={() => handleView(inspection)}><Eye className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent><p>Visualizar detalhes</p></TooltipContent></Tooltip>
                                 <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" onClick={() => handleGeneratePdf(inspection)}><FileText className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent><p>Exportar PDF</p></TooltipContent></Tooltip>
                                {user?.role === 'admin' && (
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => openDeleteConfirm(inspection.id)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent><p>Deletar vistoria</p></TooltipContent>
                                    </Tooltip>
                                )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} className="h-24 text-center">
                          Nenhuma vistoria aprovada.
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
                    <DialogTitle>Detalhes da Vistoria</DialogTitle>
                    <DialogDescription>
                        Empreendimento: {projectsMap.get(viewingItem?.projectId || '')?.name || 'N/A'}
                    </DialogDescription>
                </DialogHeader>
                {viewingItem && (
                    <div className="max-h-[60vh] overflow-y-auto pr-4 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <DetailItem label="Empreendedor" value={empreendedoresMap.get(viewingItem.empreendedorId)} />
                            <DetailItem label="Data" value={new Date(viewingItem.inspectionDate).toLocaleDateString('pt-BR')} />
                        </div>
                         <div className="grid grid-cols-2 gap-4">
                            <DetailItem label="Responsável" value={viewingItem.inspectorName} />
                            <DetailItem label="Acompanhado por" value={viewingItem.accompaniedBy} />
                        </div>
                        <Separator />
                        <h4 className="font-semibold text-foreground">Inconformidades Registradas</h4>
                        {viewingItem.inconformidades?.length > 0 ? (
                             <ul className="space-y-3">
                                {viewingItem.inconformidades.map((item, index) => (
                                    <li key={index} className="p-3 border rounded-md">
                                        <div className="flex justify-between items-start">
                                            <p className="text-sm flex-1 mr-4">{item.description}</p>
                                            <Badge variant="outline" className={cn(getCriticalityVariant(item.criticality))}>{item.criticality}</Badge>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-sm text-muted-foreground">Nenhuma inconformidade registrada.</p>
                        )}
                        {viewingItem.signatureUrl && (
                             <>
                                <Separator />
                                <h4 className="font-semibold text-foreground">Assinatura</h4>
                                <div className="p-2 border rounded-md bg-muted flex justify-center">
                                    <img src={viewingItem.signatureUrl} alt="Assinatura" className="max-w-xs" />
                                </div>
                             </>
                        )}
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
              Esta ação não pode ser desfeita. Isso irá deletar permanentemente o registro da vistoria.
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
