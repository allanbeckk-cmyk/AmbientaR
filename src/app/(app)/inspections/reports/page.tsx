
'use client';

import * as React from 'react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Download, AlertTriangle, CheckCircle } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { useAuth, useCollection, useFirebase, useMemoFirebase, useDoc } from '@/firebase';
import type { Inspection, Empreendedor, Project, CompanySettings, AppUser } from '@/lib/types';
import { collection, getDocs, query, where, doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { fetchBrandingImageAsBase64, getImageDimensions, calcPdfImageSize } from '@/lib/branding-pdf';
import { useLocalBranding } from '@/hooks/use-local-branding';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

type Report = Inspection;

export default function InspectionReportsListPage() {
  const [reportToConfirm, setReportToConfirm] = React.useState<Report | null>(null);
  const { toast } = useToast();
  const { firestore, user } = useFirebase();
  const [empreendedorIdsForUser, setEmpreendedorIdsForUser] = React.useState<string[] | undefined>(undefined);
  
  // Use state for inspections to allow for local mutation
  const [inspections, setInspections] = React.useState<Inspection[] | null>(null);

  React.useEffect(() => {
    if (user?.role === 'client' && firestore) {
        setEmpreendedorIdsForUser(undefined);
        const userDocuments = [user.cpf, ...(user.cnpjs || [])].filter(Boolean) as string[];
        if (userDocuments.length > 0) {
            const empreendedoresRef = collection(firestore, 'empreendedores');
            const q = query(empreendedoresRef, where('cpfCnpj', 'in', userDocuments));
            getDocs(q).then(snapshot => {
                const ids = snapshot.docs.map(doc => doc.id);
                setEmpreendedorIdsForUser(ids.length > 0 ? ids : ['invalid-placeholder']);
            }).catch(err => {
                console.error("Error fetching empreendedor IDs:", err);
                setEmpreendedorIdsForUser(['invalid-placeholder']);
            });
        } else {
            setEmpreendedorIdsForUser(['invalid-placeholder']);
        }
    } else if (user) {
        setEmpreendedorIdsForUser([]);
    }
  }, [user, firestore]);
  
  const projectsQuery = useMemoFirebase(() => {
    if (!firestore || empreendedorIdsForUser === undefined) return null;
    if (user?.role === 'client' && empreendedorIdsForUser.length > 0) {
        return query(collection(firestore, 'projects'), where('empreendedorId', 'in', empreendedorIdsForUser));
    }
    if (user?.role !== 'client') {
      return collection(firestore, 'projects');
    }
    return null;
  }, [firestore, user, empreendedorIdsForUser]);
  const { data: projects, isLoading: isLoadingProjects } = useCollection<Project>(projectsQuery);
  const projectIds = React.useMemo(() => projects?.map(p => p.id) || [], [projects]);
  const projectsMap = React.useMemo(() => new Map(projects?.map(p => [p.id, p.propertyName])), [projects]);

  const inspectionsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    if(user?.role === 'client') {
        if(projectIds.length === 0 && empreendedorIdsForUser && empreendedorIdsForUser.length > 0) return query(collection(firestore, 'inspections'), where('status', '==', 'invalid')); // Query that returns nothing while projects are loading
        if(projectIds.length === 0) return null;
        return query(collection(firestore, 'inspections'), where('status', '==', 'Aprovada'), where('projectId', 'in', projectIds));
    }
    return query(collection(firestore, 'inspections'), where('status', '==', 'Aprovada'));
  }, [firestore, user, projectIds, empreendedorIdsForUser]);

  const { data: fetchedInspections, isLoading: isLoadingInspections } = useCollection<Inspection>(inspectionsQuery);
  
  React.useEffect(() => {
    if(fetchedInspections) {
      setInspections(fetchedInspections);
    }
  }, [fetchedInspections]);

  const empreendedoresQuery = useMemoFirebase(() => firestore ? collection(firestore, 'empreendedores') : null, [firestore]);
  const { data: empreendedores, isLoading: isLoadingEmpreendedores } = useCollection<Empreendedor>(empreendedoresQuery);
  const empreendedoresMap = React.useMemo(() => new Map(empreendedores?.map(e => [e.id, e.name])), [empreendedores]);

  const { data: brandingData } = useLocalBranding();

  const isLoading = isLoadingInspections || isLoadingEmpreendedores || isLoadingProjects || (user?.role === 'client' && empreendedorIdsForUser === undefined);

  const handleReadConfirmation = (report: Report) => {
    setReportToConfirm(report);
  };

  const handleConfirmRead = async () => {
    if (!reportToConfirm || !user || !firestore) return;
    
    const inspectionRef = doc(firestore, 'inspections', reportToConfirm.id);
    const readEntry = { [user.uid]: new Date().toISOString() };
    
    try {
        await updateDoc(inspectionRef, {
            readBy: readEntry
        });

        // Mutate local state
        setInspections(prev => 
            prev!.map(insp => 
                insp.id === reportToConfirm.id 
                ? { ...insp, readBy: { ...insp.readBy, ...readEntry } } 
                : insp
            )
        );

        toast({
            title: 'Leitura Confirmada',
            description: `Registro de leitura para o relatório foi salvo.`,
        });
    } catch(error) {
        console.error("Error confirming read:", error);
        toast({ variant: 'destructive', title: "Erro", description: "Não foi possível confirmar a leitura."});
    }
    
    setReportToConfirm(null);
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
        const dims = await getImageDimensions(headerBase64);
        const { w, h } = calcPdfImageSize(dims, pageWidth - 20, 30);
        doc.addImage(headerBase64, 'PNG', 10, 10, w, h);
        yPos = 10 + h + 5;
    }

    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Relatório de Vistoria de Campo', pageWidth / 2, yPos, { align: 'center' });
    yPos += 15;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Empreendimento: ${projectsMap.get(report.projectId) || 'N/A'}`, 15, yPos);
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
    });
    
    if (footerBase64) {
        const totalPages = doc.getNumberOfPages();
        for (let i = 1; i <= totalPages; i++) {
            doc.setPage(i);
            const fDims = await getImageDimensions(footerBase64);
            const { w: fw, h: fh } = calcPdfImageSize(fDims, pageWidth - 20, 20);
            doc.addImage(footerBase64, 'PNG', 10, pageHeight - fh - 5, fw, fh);
        }
    }
    
    const fileName = `Relatorio_Vistoria_${(projectsMap.get(report.projectId) || 'desconhecido').replace(/\s+/g, '_')}.pdf`;
    doc.save(fileName);
  }

  return (
    <>
      <div className="flex flex-col h-full">
        <PageHeader title="Relatórios de Fiscalização e Vistoria" />
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <Card>
            <CardHeader>
              <CardTitle>Relatórios Aprovados</CardTitle>
              <CardDescription>
                Acesse e confirme a leitura dos relatórios de todas as vistorias e fiscalizações aprovadas.
              </CardDescription>
            </CardHeader>
            <CardContent>
             <TooltipProvider>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Empreendimento</TableHead>
                    <TableHead className="hidden md:table-cell">Data da Vistoria</TableHead>
                    <TableHead className="hidden lg:table-cell">Responsável</TableHead>
                    <TableHead>Leitura</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                     Array.from({ length: 3 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                        <TableCell className="hidden md:table-cell"><Skeleton className="h-5 w-24" /></TableCell>
                        <TableCell className="hidden lg:table-cell"><Skeleton className="h-5 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-28" /></TableCell>
                        <TableCell className="text-right"><Skeleton className="h-9 w-32 ml-auto" /></TableCell>
                      </TableRow>
                    ))
                  ) : inspections && inspections.length > 0 ? (
                    inspections.map((report) => {
                      const readTimestamp = user && report.readBy ? report.readBy[user.uid] : null;
                      const isRead = !!readTimestamp;
                      return (
                        <TableRow key={report.id}>
                          <TableCell className="font-medium">{projectsMap.get(report.projectId) || 'Não encontrado'}</TableCell>
                          <TableCell className="hidden md:table-cell text-muted-foreground">{new Date(report.inspectionDate).toLocaleDateString('pt-BR')}</TableCell>
                          <TableCell className="hidden lg:table-cell text-muted-foreground">{report.inspectorName}</TableCell>
                          <TableCell className="text-muted-foreground text-xs">
                            {isRead ? (
                                <>
                                    <div className="flex items-center text-green-600">
                                        <CheckCircle className="mr-1 h-3 w-3" />
                                        Confirmada
                                    </div>
                                    {new Date(readTimestamp!).toLocaleString('pt-BR')}
                                </>
                            ) : 'Pendente'}
                          </TableCell>
                          <TableCell className="text-right flex items-center justify-end gap-2">
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="outline" size="sm" onClick={() => handleGeneratePdf(report)} >
                                        <Download className="mr-2 h-4 w-4" />
                                        PDF
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent><p>Exportar PDF</p></TooltipContent>
                           </Tooltip>
                            <Button
                                variant={isRead ? "secondary" : "default"}
                                size="sm"
                                onClick={() => handleReadConfirmation(report)}
                                disabled={isRead}
                            >
                                {isRead ? 'Leitura Confirmada' : 'Confirmar Leitura'}
                            </Button>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center">
                        Nenhum relatório de vistoria aprovado.
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

      <AlertDialog open={!!reportToConfirm} onOpenChange={(open) => !open && setReportToConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
                <AlertTriangle className="text-amber-500" />
                Confirmação de Leitura
            </AlertDialogTitle>
            <AlertDialogDescription>
              <span>
                  Ao prosseguir, você confirma que está ciente do conteúdo do relatório de vistoria para o empreendimento
                  <strong className="mx-1">{projectsMap.get(reportToConfirm?.projectId || '')}</strong>.
              </span>
            </AlertDialogDescription>
            <div className="mt-4 text-xs text-muted-foreground bg-muted p-2 rounded-md">
                <div><strong>Usuário:</strong> {user?.displayName}</div>
                <div><strong>Data/Hora da Confirmação:</strong> {new Date().toLocaleString('pt-BR')}</div>
                <div>Esta ação será registrada.</div>
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmRead}>Confirmar Leitura</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
