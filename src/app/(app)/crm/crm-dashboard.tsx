
'use client';
import { useMemo } from 'react';
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
import { GitPullRequest, Target, Handshake, DollarSign } from 'lucide-react';
import { useCollection, useFirestore, useMemoFirebase, useAuth } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import type { Opportunity, Client } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export default function CrmDashboard() {
  const firestore = useFirestore();
  const { user } = useAuth();
  
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
  const clientsMap = useMemo(() => new Map(clients?.map(c => [c.id, c.name])), [clients]);


  const crmStats = useMemo(() => {
    if (!opportunities) {
      return {
        qualificacao: 0,
        proposta: 0,
        negociacao: 0,
        totalValue: 0,
        recent: [],
      };
    }

    const stats = {
        qualificacao: 0,
        proposta: 0,
        negociacao: 0,
        totalValue: 0,
    };

    opportunities.forEach(opp => {
      switch (opp.stage) {
        case 'Qualificação':
          stats.qualificacao++;
          break;
        case 'Proposta':
          stats.proposta++;
          break;
        case 'Negociação':
          stats.negociacao++;
          stats.totalValue += opp.value;
          break;
      }
    });

    const recentOpportunities = [...opportunities]
        .filter(opp => opp.stage !== 'Fechado Ganho' && opp.stage !== 'Fechado Perdido')
        .sort((a,b) => new Date(b.closeDate).getTime() - new Date(a.closeDate).getTime())
        .slice(0, 5);

    return {
      ...stats,
      recent: recentOpportunities,
    };
  }, [opportunities]);
  
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    
  const getStageVariant = (stage: Opportunity['stage']) => {
    switch (stage) {
      case 'Qualificação': return 'bg-blue-500/20 text-blue-700 border-blue-500/30';
      case 'Proposta': return 'bg-purple-500/20 text-purple-700 border-purple-500/30';
      case 'Negociação': return 'bg-yellow-500/20 text-yellow-700 border-yellow-500/30';
      case 'Fechado Ganho': return 'bg-emerald-500/20 text-emerald-700 border-emerald-500/30';
      case 'Fechado Perdido': return 'bg-red-500/20 text-red-700 border-red-500/30';
      default: return 'bg-slate-500/20 text-slate-700 border-slate-500/30';
    }
  };

  const isLoading = isLoadingOpps || isLoadingClients;

  if (!user || !['admin', 'sales', 'supervisor', 'financial'].includes(user.role)) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Acesso Restrito</CardTitle>
            </CardHeader>
            <CardContent>
                <p>Você não tem permissão para visualizar o painel de vendas.</p>
            </CardContent>
        </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Leads em Qualificação</CardTitle>
            <Target className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-1/2" /> : <div className="text-2xl font-bold">{crmStats.qualificacao}</div>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Propostas Enviadas</CardTitle>
            <GitPullRequest className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-1/2" /> : <div className="text-2xl font-bold">{crmStats.proposta}</div>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Em Negociação</CardTitle>
            <Handshake className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
             {isLoading ? <Skeleton className="h-8 w-1/2" /> : <div className="text-2xl font-bold">{crmStats.negociacao}</div>}
             {isLoading ? <Skeleton className="h-4 w-3/4 mt-1" /> : <p className="text-xs text-muted-foreground">{formatCurrency(crmStats.totalValue)} em valor</p>}
          </CardContent>
        </Card>
      </div>

       <Card>
            <CardHeader>
              <CardTitle>Oportunidades em Aberto</CardTitle>
              <CardDescription>As últimas oportunidades ativas no pipeline de vendas.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Oportunidade</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead className="hidden md:table-cell">Valor</TableHead>
                    <TableHead>Fase</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading && Array.from({length: 5}).map((_, i) => (
                    <TableRow key={i}>
                        <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                        <TableCell className="hidden md:table-cell"><Skeleton className="h-5 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-28 rounded-full" /></TableCell>
                    </TableRow>
                  ))}
                  {!isLoading && crmStats.recent.map((opp) => (
                    <TableRow key={opp.id}>
                      <TableCell className="font-medium">{opp.name}</TableCell>
                      <TableCell>{clientsMap.get(opp.clientId) || 'N/A'}</TableCell>
                      <TableCell className="hidden md:table-cell">{formatCurrency(opp.value)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn(getStageVariant(opp.stage))}>
                            {opp.stage}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                   {!isLoading && crmStats.recent.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={4} className="h-24 text-center">
                                Nenhuma oportunidade encontrada.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
    </div>
  );
}
