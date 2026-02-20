'use client';
import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, ClipboardList, LifeBuoy, Bird, Check, Edit } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collection } from 'firebase/firestore';
import type { FaunaStudy } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/page-header';
import AgendaWidget from './agenda-widget';

export default function FaunaDashboard() {
  const firestore = useFirestore();
  const { user } = useUser();
  
  const faunaStudiesQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return collection(firestore, 'faunaStudies');
  }, [firestore, user]);
  const { data: studies, isLoading: isLoadingStudies } = useCollection<FaunaStudy>(faunaStudiesQuery);

  const faunaStats = useMemo(() => {
    if (!studies) return {
        inventario: 0,
        monitoramento: 0,
        resgate: 0,
        draft: 0,
        completed: 0,
        recent: [],
    };

    const stats = {
      inventario: 0,
      monitoramento: 0,
      resgate: 0,
      draft: 0,
      completed: 0,
    };

    studies.forEach(study => {
        if (study.studyType.startsWith('inventario')) stats.inventario++;
        if (study.studyType.startsWith('monitoramento')) stats.monitoramento++;
        if (study.studyType.startsWith('resgate')) stats.resgate++;
        
        if(study.status === 'draft') stats.draft++;
        if(study.status === 'completed') stats.completed++;
    });
    
    // @ts-ignore
    const recentStudies = [...(studies || [])]
        .sort((a,b) => (b.createdAt?.toDate() || 0) - (a.createdAt?.toDate() || 0))
        .slice(0, 5);

    return {
      ...stats,
      recent: recentStudies,
    };
  }, [studies]);

  const isLoading = isLoadingStudies;
  
  const getStatusVariant = (status?: 'draft' | 'completed') => {
    switch (status) {
      case 'completed': return 'bg-emerald-500/20 text-emerald-700 border-emerald-500/30';
      case 'draft': return 'bg-yellow-500/20 text-yellow-700 border-yellow-500/30';
      default: return 'bg-slate-500/20 text-slate-700 border-slate-500/30';
    }
  };
  
  const getStatusLabel = (status?: 'draft' | 'completed') => {
    switch (status) {
        case 'completed': return 'Concluído';
        case 'draft': return 'Rascunho';
        default: return 'Não definido';
    }
  }
  
  const getStudyTypeLabel = (studyType: FaunaStudy['studyType']) => {
    if (studyType.startsWith('inventario')) return 'Inventário';
    if (studyType.startsWith('monitoramento')) return 'Monitoramento';
    if (studyType.startsWith('resgate')) return 'Resgate';
    return 'Estudo de Fauna';
  }

  return (
    <div className="flex flex-col h-full">
      <PageHeader title="Painel do Diretor de Fauna" />
       <main className="flex-1 overflow-auto p-4 md:p-6 space-y-8">
            <AgendaWidget />
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Inventários de Fauna</CardTitle>
                    <ClipboardList className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                    {isLoading ? <Skeleton className="h-8 w-1/2" /> : <div className="text-2xl font-bold">{faunaStats.inventario}</div>}
                    <p className="text-xs text-muted-foreground">Projetos e relatórios de inventário</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Monitoramentos de Fauna</CardTitle>
                    <FileText className="h-4 w-4 text-orange-500" />
                </CardHeader>
                <CardContent>
                    {isLoading ? <Skeleton className="h-8 w-1/2" /> : <div className="text-2xl font-bold">{faunaStats.monitoramento}</div>}
                     <p className="text-xs text-muted-foreground">Projetos e relatórios de monitoramento</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Resgates de Fauna</CardTitle>
                    <LifeBuoy className="h-4 w-4 text-red-500" />
                </CardHeader>
                <CardContent>
                    {isLoading ? <Skeleton className="h-8 w-1/2" /> : <div className="text-2xl font-bold">{faunaStats.resgate}</div>}
                    <p className="text-xs text-muted-foreground">Projetos e relatórios de resgate</p>
                </CardContent>
            </Card>
            </div>
             <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Estudos em Rascunho</CardTitle>
                        <Edit className="h-4 w-4 text-yellow-500" />
                    </CardHeader>
                    <CardContent>
                        {isLoading ? <Skeleton className="h-8 w-1/2" /> : <div className="text-2xl font-bold">{faunaStats.draft}</div>}
                        <p className="text-xs text-muted-foreground">Projetos e relatórios a serem finalizados</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Estudos Concluídos</CardTitle>
                        <Check className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        {isLoading ? <Skeleton className="h-8 w-1/2" /> : <div className="text-2xl font-bold">{faunaStats.completed}</div>}
                        <p className="text-xs text-muted-foreground">Total de documentos finalizados</p>
                    </CardContent>
                </Card>
             </div>
             <Card>
                <CardHeader>
                    <CardTitle>Atividade Recente em Estudos de Fauna</CardTitle>
                    <CardDescription>Os últimos estudos criados ou atualizados.</CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? <Skeleton className="h-40 w-full" /> : faunaStats.recent.length > 0 ? (
                        <div className="space-y-4">
                            {faunaStats.recent.map((study: FaunaStudy) => (
                                <div key={study.id} className="flex items-center justify-between">
                                    <div className="grid gap-1">
                                        <p className="font-semibold">{getStudyTypeLabel(study.studyType)}</p>
                                        <p className="text-sm text-muted-foreground">
                                            {/* @ts-ignore */}
                                            Empreendedor: {study.empreendedor?.name || 'Não especificado'}
                                        </p>
                                    </div>
                                    <Badge variant={'outline'} className={cn(getStatusVariant(study.status))}>
                                        {getStatusLabel(study.status)}
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground text-center py-8">Nenhuma atividade recente.</p>
                    )}
                </CardContent>
            </Card>
        </main>
    </div>
  );
}
