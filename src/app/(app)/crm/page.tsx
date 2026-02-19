
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MoreHorizontal, PlusCircle, DollarSign, Calendar as CalendarIcon, ChevronDown } from 'lucide-react';
import type { Opportunity, OpportunityStage, Client, AppUser } from '@/lib/types';
import { useCollection, useFirestore, useMemoFirebase, useUser, errorEmitter } from '@/firebase';
import { collection, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
    DropdownMenuPortal,
    DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
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
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { FirestorePermissionError } from '@/firebase/errors';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CrmDashboard from './crm-dashboard';

const pipelineStages: OpportunityStage[] = [
  'Qualificação',
  'Proposta',
  'Negociação',
  'Fechado Ganho',
  'Fechado Perdido',
];

const stageColors: Record<OpportunityStage, string> = {
    'Qualificação': 'border-blue-500',
    'Proposta': 'border-purple-500',
    'Negociação': 'border-yellow-500',
    'Fechado Ganho': 'border-green-500',
    'Fechado Perdido': 'border-red-500',
}

const canPerformWriteActions = (user: AppUser | null): boolean => {
    if (!user) return false;
    return ['admin', 'sales', 'supervisor'].includes(user.role);
}


export default function CrmPage() {
  const [isAlertOpen, setIsAlertOpen] = React.useState(false);
  const [itemToDelete, setItemToDelete] = React.useState<string | null>(null);
  const router = useRouter();
  
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();

  const opportunitiesQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return collection(firestore, 'opportunities');
  }, [firestore, user]);
  const { data: opportunities, isLoading: isLoadingOpps } = useCollection<Opportunity>(opportunitiesQuery);
  
  const clientsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return collection(firestore, 'clients');
  }, [firestore, user]);
  const { data: clients, isLoading: isLoadingClients } = useCollection<Client>(clientsQuery);
  
  const clientsMap = React.useMemo(() => {
    if (!clients) return new Map();
    return new Map(clients.map(c => [c.id, c.name]));
  }, [clients]);

  const activeOpportunities = React.useMemo(() => {
    if (!opportunities) return [];
    return opportunities.filter(opp => opp.stage !== 'Fechado Ganho' && opp.stage !== 'Fechado Perdido');
  }, [opportunities]);
  
  const handleAddNew = () => {
    router.push('/crm/new');
  };

  const handleEdit = (item: Opportunity) => {
    router.push(`/crm/${item.id}/edit`);
  };

  const handleMoveStage = (opportunityId: string, newStage: OpportunityStage) => {
    if (!firestore) return;
    const oppRef = doc(firestore, 'opportunities', opportunityId);
    updateDoc(oppRef, { stage: newStage }).catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({ path: oppRef.path, operation: 'update', requestResourceData: { stage: newStage }});
        errorEmitter.emit('permission-error', permissionError);
    });
  };

  const openDeleteConfirm = (itemId: string) => {
    setItemToDelete(itemId);
    setIsAlertOpen(true);
  };

  const handleDelete = () => {
    if (!firestore || !itemToDelete) return;
    const docRef = doc(firestore, 'opportunities', itemToDelete);
    deleteDoc(docRef)
      .then(() => {
        toast({ title: 'Oportunidade deletada', description: 'A oportunidade foi removida com sucesso.' });
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


  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {timeZone: 'UTC'});
  }

  const isLoading = isLoadingOpps || isLoadingClients;

  return (
    <>
      <div className="flex flex-col h-full">
        <PageHeader title="Painel de Vendas (CRM)">
          {canPerformWriteActions(user) && (
            <Button size="sm" className="gap-1" onClick={handleAddNew}>
                <PlusCircle className="h-4 w-4" />
                Nova Oportunidade
            </Button>
          )}
        </PageHeader>
        <main className="flex-1 overflow-auto p-4 md:p-6">
            <Tabs defaultValue="overview" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="overview">Visão Geral</TabsTrigger>
                    <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
                </TabsList>
                <TabsContent value="overview" className="space-y-4">
                    <CrmDashboard />
                </TabsContent>
                <TabsContent value="pipeline">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 items-start">
                        {pipelineStages.filter(stage => stage !== 'Fechado Ganho' && stage !== 'Fechado Perdido').map(stage => (
                            <div key={stage} className="flex flex-col gap-4">
                                <h2 className="font-semibold text-lg px-1">{stage}</h2>
                                <div className="bg-muted/50 rounded-lg p-2 space-y-4 min-h-[200px]">
                                    {isLoading && <OpportunityCardSkeleton />}
                                    {activeOpportunities?.filter(opp => opp.stage === stage).map(opp => (
                                        <Card key={opp.id} className={cn("bg-card border-l-4", stageColors[stage])}>
                                            <CardHeader className="p-4 flex-row items-start justify-between">
                                                <div className="space-y-1">
                                                    <CardTitle className="text-base">{opp.name}</CardTitle>
                                                    <p className="text-sm text-muted-foreground">{clientsMap.get(opp.clientId) || 'Cliente desconhecido'}</p>
                                                </div>
                                                {canPerformWriteActions(user) && (
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0">
                                                                <MoreHorizontal className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem onClick={() => handleEdit(opp)}>Editar</DropdownMenuItem>
                                                                <DropdownMenuSub>
                                                                    <DropdownMenuSubTrigger>Mover para</DropdownMenuSubTrigger>
                                                                    <DropdownMenuPortal>
                                                                        <DropdownMenuSubContent>
                                                                        {pipelineStages.filter(s => s !== stage).map(s => (
                                                                            <DropdownMenuItem key={s} onClick={() => handleMoveStage(opp.id, s)}>
                                                                                {s}
                                                                            </DropdownMenuItem>
                                                                        ))}
                                                                        </DropdownMenuSubContent>
                                                                    </DropdownMenuPortal>
                                                                </DropdownMenuSub>
                                                                <DropdownMenuSeparator />
                                                                <DropdownMenuItem className="text-destructive" onClick={() => openDeleteConfirm(opp.id)}>
                                                                    Deletar
                                                                </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                )}
                                            </CardHeader>
                                            <CardContent className="p-4 pt-0 space-y-2 text-sm">
                                                <div className="flex items-center gap-2 text-muted-foreground">
                                                    <DollarSign className="h-4 w-4"/>
                                                    <span>{formatCurrency(opp.value)}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-muted-foreground">
                                                    <CalendarIcon className="h-4 w-4"/>
                                                    <span>{formatDate(opp.closeDate)}</span>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                    {!isLoading && activeOpportunities?.filter(opp => opp.stage === stage).length === 0 && (
                                        <div className="flex items-center justify-center h-full p-8 text-center">
                                            <p className="text-sm text-muted-foreground">Arraste oportunidades aqui.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </TabsContent>
            </Tabs>
        </main>
      </div>

        <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
            <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                <AlertDialogDescription>
                Esta ação não pode ser desfeita. Isso irá deletar permanentemente a oportunidade.
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

const OpportunityCardSkeleton = () => (
    <Card className="bg-card">
        <CardHeader className="p-4 flex-row items-start justify-between">
            <div className="space-y-2">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-24" />
            </div>
            <Skeleton className="h-6 w-6 rounded-full" />
        </CardHeader>
        <CardContent className="p-4 pt-0 space-y-3">
             <Skeleton className="h-4 w-20" />
             <Skeleton className="h-4 w-24" />
        </CardContent>
    </Card>
)
