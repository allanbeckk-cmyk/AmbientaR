
'use client';

import * as React from 'react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FileText, Download, PlusCircle, Paperclip } from 'lucide-react';
import { useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import type { FaunaStudy, Empreendedor } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { FaunaUploadForm } from './fauna-upload-form';

const studyTypeMap: Record<string, string> = {
  inventario_projeto: "Projeto de Inventário",
  inventario_relatorio: "Relatório de Inventário",
  monitoramento_projeto: "Projeto de Monitoramento",
  monitoramento_relatorio: "Relatório de Monitoramento",
  resgate_projeto: "Projeto de Resgate",
  resgate_relatorio: "Relatório de Resgate",
  externo: "Documento Externo",
};

export default function FaunaManagementPage() {
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const { firestore, user } = useFirebase();
  const { toast } = useToast();

  const approvedStudiesQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    // Querying for both completed internal studies and all external documents
    return query(collection(firestore, 'faunaStudies'), where('status', '==', 'completed'));
  }, [firestore, user]);

  const { data: studies, isLoading: isLoadingStudies, mutate } = useCollection<FaunaStudy>(approvedStudiesQuery);

  const empreendedoresQuery = useMemoFirebase(() => firestore ? collection(firestore, 'empreendedores') : null, [firestore]);
  const { data: empreendedores, isLoading: isLoadingEmpreendedores } = useCollection<Empreendedor>(empreendedoresQuery);

  const empreendedorMap = React.useMemo(() => {
    if (!empreendedores) return new Map();
    return new Map(empreendedores.map(e => [e.id, e.name]));
  }, [empreendedores]);

  const isLoading = isLoadingStudies || isLoadingEmpreendedores;

  const handleExport = (format: 'pdf' | 'docx') => {
      toast({ title: "Funcionalidade em desenvolvimento" });
  }

  const getStatusVariant = (status?: 'draft' | 'completed') => {
    switch (status) {
      case 'completed': return 'bg-emerald-500/20 text-emerald-700 border-emerald-500/30';
      default: return 'bg-slate-500/20 text-slate-700 border-slate-500/30';
    }
  };
  
  const getStatusLabel = (status?: 'draft' | 'completed') => {
    switch (status) {
        case 'completed': return 'Concluído';
        default: return 'Não definido';
    }
  }

  const getStudyOrDocumentName = (study: FaunaStudy) => {
    if (study.studyType === 'externo') {
      return study.documentName || 'Documento Externo';
    }
    return studyTypeMap[study.studyType] || 'Desconhecido';
  }

  return (
    <>
      <div className="flex flex-col h-full">
        <PageHeader title="Gestão de Autorizações e Relatórios de Fauna">
           <Button size="sm" className="gap-1" onClick={() => setIsFormOpen(true)}>
            <PlusCircle className="h-4 w-4" />
            Adicionar Documento Externo
          </Button>
        </PageHeader>
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <Card>
            <CardHeader>
              <CardTitle>Relatórios e Licenças Concluídas</CardTitle>
              <CardDescription>Visualize e baixe todos os documentos de fauna que já foram aprovados ou adicionados.</CardDescription>
            </CardHeader>
            <CardContent>
              <TooltipProvider>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Empreendedor</TableHead>
                      <TableHead>Tipo de Documento</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading && Array.from({ length: 3 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-24 rounded-full" /></TableCell>
                        <TableCell className="text-right"><Skeleton className="h-8 w-24 ml-auto" /></TableCell>
                      </TableRow>
                    ))}
                    {!isLoading && studies?.map((study) => (
                      <TableRow key={study.id}>
                        <TableCell className="font-medium">{empreendedorMap.get(study.empreendedorId) || 'Não definido'}</TableCell>
                        <TableCell>{getStudyOrDocumentName(study)}</TableCell>
                        <TableCell>
                          <Badge variant={'outline'} className={cn(getStatusVariant(study.status))}>
                            {getStatusLabel(study.status)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    {study.fileUrl ? (
                                        <Button asChild variant="ghost" size="icon">
                                            <a href={study.fileUrl} target="_blank" rel="noopener noreferrer">
                                                <Download className="h-4 w-4" />
                                            </a>
                                        </Button>
                                    ) : (
                                        <Button variant="ghost" size="icon" disabled>
                                            <Download className="h-4 w-4" />
                                        </Button>
                                    )}
                                </TooltipTrigger>
                                <TooltipContent><p>{study.fileUrl ? 'Baixar documento' : 'Nenhum documento anexado'}</p></TooltipContent>
                            </Tooltip>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {!isLoading && studies?.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="h-24 text-center">Nenhum estudo concluído encontrado.</TableCell>
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
        <DialogContent className="sm:max-w-xl">
          <FaunaUploadForm onSuccess={() => {
            mutate(); // Re-fetches the data
            setIsFormOpen(false);
          }}/>
        </DialogContent>
      </Dialog>
    </>
  );
}
