
'use client';
import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
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
import { MoreHorizontal, PlusCircle, ChevronDown, FolderOpen, Droplets, FileCheck2, Trees, Waves } from 'lucide-react';
import { useCollection, useFirebase, useMemoFirebase, errorEmitter, useAuth } from '@/firebase';
import { collection, doc, deleteDoc, query, where, getDocs } from 'firebase/firestore';
import type { Condicionante, Project, License, WaterPermit, EnvironmentalIntervention, AppUser, Empreendedor } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent
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
import { ComplianceForm } from './compliance-form';
import { useToast } from '@/hooks/use-toast';
import { FirestorePermissionError } from '@/firebase/errors';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const canPerformWriteActions = (user: AppUser | null): boolean => {
    if (!user) return false;
    return user.role === 'admin' || user.role === 'gestor' || user.role === 'supervisor';
}

export default function CompliancePage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<Condicionante | null>(null);
  const [selectedType, setSelectedType] = useState<'licenca' | 'outorga' | 'intervencao'>('licenca');

  const searchParams = useSearchParams();
  const highlightLicenseId = searchParams.get('licenseId');
  const highlightOutorgaId = searchParams.get('outorgaId');
  const highlightIntervencaoId = searchParams.get('intervencaoId');

  const { firestore } = useFirebase();
  const { user } = useAuth();
  const { toast } = useToast();
  
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
    if (user?.role === 'client' && empreendedorIdsForUser.length === 0) return null;
    if (user?.role === 'client') {
      return query(collection(firestore, 'projects'), where('empreendedorId', 'in', empreendedorIdsForUser));
    }
    return collection(firestore, 'projects');
  }, [firestore, user, empreendedorIdsForUser]);
  const { data: projects, isLoading: isLoadingProjects } = useCollection<Project>(projectsQuery);

  const projectIds = useMemo(() => projects?.map(p => p.id) || [], [projects]);

  const licensesQuery = useMemoFirebase(() => firestore ? collection(firestore, 'licenses') : null, [firestore]);
  const { data: licenses, isLoading: isLoadingLicenses } = useCollection<License>(licensesQuery);

  const licenseIds = useMemo(() => {
    if (!licenses || !projects) return [];
    const userProjectIdSet = new Set(projectIds);
    return licenses.filter(l => userProjectIdSet.has(l.projectId)).map(l => l.id);
  }, [licenses, projects, projectIds]);

  const clientReferenceIds = useMemo(() => {
    const ids = [...projectIds, ...licenseIds];
    return ids.length > 0 ? ids : ['invalid-placeholder'];
  }, [projectIds, licenseIds]);

  const condicionantesQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    if (user.role === 'client') {
       if(empreendedorIdsForUser === undefined) return null;
       if(empreendedorIdsForUser.length > 0 && clientReferenceIds.length === 0) return null;
       if(clientReferenceIds.length > 0 && clientReferenceIds[0] !== 'invalid-placeholder') {
         return query(collection(firestore, 'condicionantes'), where('referenceId', 'in', clientReferenceIds));
       }
       return null;
    }
    return collection(firestore, 'condicionantes');
  }, [firestore, user, clientReferenceIds, empreendedorIdsForUser]);

  const { data: condicionantes, isLoading: isLoadingCondicionantes } = useCollection<Condicionante>(condicionantesQuery);

  const outorgasQuery = useMemoFirebase(() => firestore ? collection(firestore, 'outorgas') : null, [firestore]);
  const { data: outorgas, isLoading: isLoadingOutorgas } = useCollection<WaterPermit>(outorgasQuery);

  const intervencoesQuery = useMemoFirebase(() => firestore ? collection(firestore, 'intervencoes') : null, [firestore]);
  const { data: intervencoes, isLoading: isLoadingIntervencoes } = useCollection<EnvironmentalIntervention>(intervencoesQuery);

  const projectsMap = useMemo(() => new Map(projects?.map(p => [p.id, p])), [projects]);
  const licensesMap = useMemo(() => new Map(licenses?.map(l => [l.id, l])), [licenses]);
  const outorgasMap = useMemo(() => new Map(outorgas?.map(o => [o.id, o])), [outorgas]);
  const intervencoesMap = useMemo(() => new Map(intervencoes?.map(i => [i.id, i])), [intervencoes]);
  
  const isLoading = isLoadingCondicionantes || isLoadingProjects || isLoadingLicenses || isLoadingOutorgas || isLoadingIntervencoes || (user?.role === 'client' && empreendedorIdsForUser === undefined);
  
  const { licencaGroups, outorgaGroups, intervencaoGroups, usoInsignificanteGroups } = useMemo(() => {
    if (!condicionantes) return { licencaGroups: new Map(), outorgaGroups: new Map(), intervencaoGroups: new Map(), usoInsignificanteGroups: new Map() };
    
    const licencaGroups = new Map<string, Condicionante[]>();
    const outorgaGroups = new Map<string, Condicionante[]>();
    const intervencaoGroups = new Map<string, Condicionante[]>();
    const usoInsignificanteGroups = new Map<string, Condicionante[]>();

    condicionantes.forEach(item => {
      if (item.referenceType === 'licenca') {
        const group = licencaGroups.get(item.referenceId) || [];
        group.push(item);
        licencaGroups.set(item.referenceId, group);
      } else if (item.referenceType === 'outorga') {
        const group = outorgaGroups.get(item.referenceId) || [];
        group.push(item);
        outorgaGroups.set(item.referenceId, group);
      } else if (item.referenceType === 'intervencao') {
        const group = intervencaoGroups.get(item.referenceId) || [];
        group.push(item);
        intervencaoGroups.set(item.referenceId, group);
      } else if (item.referenceType === 'uso_insignificante') {
        const group = usoInsignificanteGroups.get(item.referenceId) || [];
        group.push(item);
        usoInsignificanteGroups.set(item.referenceId, group);
      }
    });

    return { licencaGroups, outorgaGroups, intervencaoGroups, usoInsignificanteGroups };

  }, [condicionantes]);

  const handleAddNew = (type: 'licenca' | 'outorga' | 'intervencao') => {
    setEditingItem(null);
    setSelectedType(type);
    setIsDialogOpen(true);
  };

  const handleEdit = (item: Condicionante) => {
    setEditingItem(item);
    setSelectedType(item.referenceType);
    setIsDialogOpen(true);
  };

  const openDeleteConfirm = (itemId: string) => {
    setItemToDelete(itemId);
    setIsAlertOpen(true);
  };

  const handleDelete = () => {
    if (!firestore || !itemToDelete) return;
    const docRef = doc(firestore, 'condicionantes', itemToDelete);
    deleteDoc(docRef)
      .then(() => {
        toast({
          title: 'Condicionante deletada',
          description: 'A condicionante foi removida com sucesso.',
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

  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('pt-BR', { timeZone: 'UTC' });

  const getStatusVariant = (status: Condicionante['status']) => {
    switch (status) {
      case 'Pendente': return 'bg-yellow-500/20 text-yellow-700 border-yellow-500/30';
      case 'Em Execução': return 'bg-blue-500/20 text-blue-700 border-blue-500/30';
      case 'Cumprida': return 'bg-emerald-500/20 text-emerald-700 border-emerald-500/30';
      case 'Atrasada': return 'bg-red-500/20 text-red-700 border-red-500/30';
      default: return 'bg-slate-500/20 text-slate-700 border-slate-500/30';
    }
  };
  
  const renderConditionantesTable = (items: Condicionante[]) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-2/5">Descrição</TableHead>
          <TableHead>Vencimento</TableHead>
          <TableHead>Recorrência</TableHead>
          <TableHead>Status</TableHead>
          {canPerformWriteActions(user) && (
            <TableHead>
              <span className="sr-only">Ações</span>
            </TableHead>
          )}
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) => (
            <TableRow key={item.id}>
                <TableCell className="font-medium max-w-xs truncate">{item.description}</TableCell>
                <TableCell className="text-muted-foreground">{formatDate(item.dueDate)}</TableCell>
                <TableCell className="text-muted-foreground">{item.recurrence}</TableCell>
                <TableCell>
                <Badge variant={'outline'} className={cn(getStatusVariant(item.status))}>
                    {item.status}
                </Badge>
                </TableCell>
                {canPerformWriteActions(user) && (
                    <TableCell>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                            <Button aria-haspopup="true" size="icon" variant="ghost">
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Toggle menu</span>
                            </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Ações</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => handleEdit(item)}>Editar</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => openDeleteConfirm(item.id)}
                            >
                                Deletar
                            </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </TableCell>
                )}
            </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  const renderClientView = () => (
      <Card>
          <CardHeader>
              <CardTitle>Minhas Condicionantes</CardTitle>
              <CardDescription>Acompanhe as condicionantes dos seus projetos.</CardDescription>
          </CardHeader>
          <CardContent>
              {isLoading ? (
                  <Skeleton className="h-40 w-full" />
              ) : (
                  renderConditionantesTable(condicionantes || [])
              )}
               {!isLoading && (!condicionantes || condicionantes.length === 0) && (
                <div className="h-24 text-center flex items-center justify-center border-2 border-dashed rounded-md">
                    <p className="text-muted-foreground">Nenhuma condicionante encontrada para seus projetos.</p>
                </div>
            )}
          </CardContent>
      </Card>
  );

  const renderManagerView = () => (
    <div className="grid gap-6 grid-cols-1 items-start">
        <Card>
        <CardHeader>
            <CardTitle className="flex items-center gap-2">
            <FileCheck2 className="w-5 h-5"/>
            Condicionantes de Licenças
            </CardTitle>
            <CardDescription>Condicionantes vinculadas a licenças ambientais.</CardDescription>
        </CardHeader>
        <CardContent>
            {isLoading ? <Skeleton className="h-40 w-full"/> : (
                <Accordion type="single" collapsible className="w-full" defaultValue={highlightLicenseId || undefined}>
                    {Array.from(licencaGroups.entries()).map(([licenseId, items]) => {
                        const license = licensesMap.get(licenseId);
                        const project = license ? projectsMap.get(license.projectId) : null;
                        return (
                            <AccordionItem value={licenseId} key={licenseId}>
                                <AccordionTrigger>
                                    <div className="flex flex-col items-start text-left">
                                        <span className="font-semibold">
                                          {license ? `${license.permitNumber} - ${license.permitType}` : 'Licença não encontrada'}
                                        </span>
                                        <span className="text-xs text-muted-foreground">
                                          {license ? `${project?.propertyName || ''} | Processo: ${license.processNumber}` : licenseId}
                                        </span>
                                        {license && (
                                          <Badge variant={'outline'} className={cn('mt-1 text-[10px]', getStatusVariant(license.status as any))}>
                                            {license.status}
                                          </Badge>
                                        )}
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent>
                                    {renderConditionantesTable(items)}
                                </AccordionContent>
                            </AccordionItem>
                        )
                    })}
                        {licencaGroups.size === 0 && (
                        <div className="h-24 text-center flex items-center justify-center border-2 border-dashed rounded-md">
                            <p className="text-muted-foreground">Nenhuma condicionante de licença encontrada.</p>
                        </div>
                    )}
                </Accordion>
            )}
        </CardContent>
        </Card>
        <Card>
        <CardHeader>
            <CardTitle className="flex items-center gap-2">
            <Droplets className="w-5 h-5" />
            Condicionantes de Outorgas
            </CardTitle>
            <CardDescription>Condicionantes vinculadas a outorgas de uso de água.</CardDescription>
        </CardHeader>
        <CardContent>
            {isLoading ? <Skeleton className="h-40 w-full"/> : (
                <Accordion type="single" collapsible className="w-full" defaultValue={highlightOutorgaId || undefined}>
                        {Array.from(outorgaGroups.entries()).map(([outorgaId, items]) => {
                        const outorga = outorgasMap.get(outorgaId);
                        return (
                            <AccordionItem value={outorgaId} key={outorgaId}>
                                <AccordionTrigger>
                                    <div className="flex flex-col items-start text-left">
                                        <span className="font-semibold">{outorga?.description || 'Outorga não encontrada'}</span>
                                        <span className="text-xs text-muted-foreground">{outorga?.permitNumber || outorgaId}</span>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent>
                                    {renderConditionantesTable(items)}
                                </AccordionContent>
                            </AccordionItem>
                        )
                    })}
                    {outorgaGroups.size === 0 && (
                        <div className="h-24 text-center flex items-center justify-center border-2 border-dashed rounded-md">
                            <p className="text-muted-foreground">Nenhuma condicionante de outorga encontrada.</p>
                        </div>
                    )}
                </Accordion>
            )}
        </CardContent>
        </Card>
        <Card>
        <CardHeader>
            <CardTitle className="flex items-center gap-2">
            <Trees className="w-5 h-5" />
            Condicionantes de Intervenção
            </CardTitle>
            <CardDescription>Condicionantes vinculadas a intervenções ambientais.</CardDescription>
        </CardHeader>
        <CardContent>
            {isLoading ? <Skeleton className="h-40 w-full"/> : (
                <Accordion type="single" collapsible className="w-full" defaultValue={highlightIntervencaoId || undefined}>
                        {Array.from(intervencaoGroups.entries()).map(([intervencaoId, items]) => {
                        const intervencao = intervencoesMap.get(intervencaoId);
                        return (
                            <AccordionItem value={intervencaoId} key={intervencaoId}>
                                <AccordionTrigger>
                                    <div className="flex flex-col items-start text-left">
                                        <span className="font-semibold">{intervencao?.description || 'Intervenção não encontrada'}</span>
                                        <span className="text-xs text-muted-foreground">{intervencao?.processNumber || intervencaoId}</span>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent>
                                    {renderConditionantesTable(items)}
                                </AccordionContent>
                            </AccordionItem>
                        )
                    })}
                    {intervencaoGroups.size === 0 && (
                        <div className="h-24 text-center flex items-center justify-center border-2 border-dashed rounded-md">
                            <p className="text-muted-foreground">Nenhuma condicionante de intervenção encontrada.</p>
                        </div>
                    )}
                </Accordion>
            )}
        </CardContent>
        </Card>
        <Card>
        <CardHeader>
            <CardTitle className="flex items-center gap-2">
            <Waves className="w-5 h-5" />
            Condicionantes de Usos Insignificantes
            </CardTitle>
            <CardDescription>Condicionantes vinculadas a usos insignificantes de recursos hídricos.</CardDescription>
        </CardHeader>
        <CardContent>
            {isLoading ? <Skeleton className="h-40 w-full"/> : (
                <Accordion type="single" collapsible className="w-full">
                        {Array.from(usoInsignificanteGroups.entries()).map(([refId, items]) => {
                        return (
                            <AccordionItem value={refId} key={refId}>
                                <AccordionTrigger>
                                    <div className="flex flex-col items-start text-left">
                                        <span className="font-semibold">Uso Insignificante</span>
                                        <span className="text-xs text-muted-foreground">{refId}</span>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent>
                                    {renderConditionantesTable(items)}
                                </AccordionContent>
                            </AccordionItem>
                        )
                    })}
                    {usoInsignificanteGroups.size === 0 && (
                        <div className="h-24 text-center flex items-center justify-center border-2 border-dashed rounded-md">
                            <p className="text-muted-foreground">Nenhuma condicionante de uso insignificante encontrada.</p>
                        </div>
                    )}
                </Accordion>
            )}
        </CardContent>
        </Card>
    </div>
  );


  return (
    <>
      <div className="flex flex-col h-full">
        <PageHeader title="Gerenciamento de Condicionantes">
            {canPerformWriteActions(user) && (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button size="sm" className="gap-1">
                        <PlusCircle className="h-4 w-4" />
                        Nova Condicionante
                        <ChevronDown className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                        <DropdownMenuLabel>Selecione o tipo de referência</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleAddNew('licenca')}>
                            Licença
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleAddNew('outorga')}>
                            Outorga
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleAddNew('intervencao')}>
                            Intervenção Ambiental
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleAddNew('uso_insignificante')}>
                            Uso Insignificante
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            )}
        </PageHeader>
        <main className="flex-1 overflow-auto p-4 md:p-6">
            {user?.role === 'client' ? renderClientView() : renderManagerView()}
        </main>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-2xl h-full max-h-[90dvh] flex flex-col">
          <ComplianceForm
            currentItem={editingItem}
            referenceType={selectedType}
            onSuccess={() => setIsDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
      
      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isso irá deletar permanentemente a condicionante.
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
