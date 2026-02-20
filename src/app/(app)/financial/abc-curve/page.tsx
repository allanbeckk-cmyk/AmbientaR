'use client';
import { useMemo } from 'react';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import type { Revenue, Invoice, Client } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export default function AbcCurvePage() {
  const { firestore, user } = useFirebase();

  const revenuesQuery = useMemoFirebase(() => (firestore && user ? collection(firestore, 'revenues') : null), [firestore, user]);
  const { data: revenuesData, isLoading: isLoadingRevenues } = useCollection<Revenue>(revenuesQuery);

  const invoicesQuery = useMemoFirebase(() => (firestore && user ? collection(firestore, 'invoices') : null), [firestore, user]);
  const { data: invoicesData, isLoading: isLoadingInvoices } = useCollection<Invoice>(invoicesQuery);

  const clientsQuery = useMemoFirebase(() => (firestore && user ? collection(firestore, 'clients') : null), [firestore, user]);
  const { data: clients, isLoading: isLoadingClients } = useCollection<Client>(clientsQuery);

  const clientsMap = useMemo(() => new Map(clients?.map(c => [c.id, c.name])), [clients]);
  
  const isLoading = isLoadingRevenues || isLoadingInvoices || isLoadingClients;

  const abcData = useMemo(() => {
    if (isLoading || !revenuesData || !invoicesData || !clients) {
      return { chartData: [], tableData: [] };
    }

    const clientRevenue: Record<string, number> = {};

    // Processar receitas diretas
    revenuesData.forEach(revenue => {
      if (revenue.clientId) {
        clientRevenue[revenue.clientId] = (clientRevenue[revenue.clientId] || 0) + revenue.amount;
      }
    });

    // Processar faturas pagas
    invoicesData.forEach(invoice => {
      if (invoice.status === 'Paid') {
        clientRevenue[invoice.clientId] = (clientRevenue[invoice.clientId] || 0) + invoice.amount;
      }
    });
    
    const clientDataArray = Object.entries(clientRevenue).map(([clientId, totalRevenue]) => ({
      clientId,
      clientName: clientsMap.get(clientId) || 'Cliente Desconhecido',
      totalRevenue,
    }));

    const sortedClients = clientDataArray.sort((a, b) => b.totalRevenue - a.totalRevenue);
    const totalCombinedRevenue = sortedClients.reduce((acc, c) => acc + c.totalRevenue, 0);

    let cumulativeRevenue = 0;
    let cumulativeCount = 0;

    const analyzedData = sortedClients.map(client => {
      cumulativeRevenue += client.totalRevenue;
      cumulativeCount++;
      const revenuePercentage = (client.totalRevenue / totalCombinedRevenue) * 100;
      const cumulativeRevenuePercentage = (cumulativeRevenue / totalCombinedRevenue) * 100;
      
      let classification: 'A' | 'B' | 'C' = 'C';
      if (cumulativeRevenuePercentage <= 80) {
        classification = 'A';
      } else if (cumulativeRevenuePercentage <= 95) {
        classification = 'B';
      }

      return {
        ...client,
        revenuePercentage,
        cumulativeRevenuePercentage,
        classification,
      };
    });

    const chartData = analyzedData.map(item => ({
        name: item.clientName,
        'Receita Acumulada (%)': parseFloat(item.cumulativeRevenuePercentage.toFixed(2)),
    }));

    return { chartData, tableData: analyzedData };

  }, [revenuesData, invoicesData, clients, clientsMap, isLoading]);

  const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const getClassificationVariant = (classification: 'A' | 'B' | 'C') => {
    switch (classification) {
      case 'A': return 'bg-emerald-500/20 text-emerald-700 border-emerald-500/30';
      case 'B': return 'bg-yellow-500/20 text-yellow-700 border-yellow-500/30';
      case 'C': return 'bg-red-500/20 text-red-700 border-red-500/30';
      default: return 'bg-slate-500/20 text-slate-700 border-slate-500/30';
    }
  };

  return (
    <div className="flex flex-col h-full">
      <PageHeader title="Análise da Curva ABC de Clientes" />
      <main className="flex-1 overflow-auto p-4 md:p-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Gráfico da Curva ABC</CardTitle>
            <CardDescription>
              Este gráfico mostra a contribuição acumulada da receita por cliente, ajudando a identificar os mais importantes (Curva A).
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-[400px] w-full" /> : (
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart
                  data={abcData.chartData}
                  margin={{
                    top: 10, right: 30, left: 20, bottom: 50,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="name" 
                    angle={-30}
                    textAnchor="end"
                    interval={0}
                    tick={{ fontSize: 10 }}
                    height={80}
                  />
                  <YAxis 
                    label={{ value: 'Receita Acumulada (%)', angle: -90, position: 'insideLeft', offset: -10 }}
                    tickFormatter={(value) => `${value}%`}
                  />
                  <Tooltip
                    formatter={(value, name) => [`${value}%`, name]}
                    labelFormatter={(label) => `Cliente: ${label}`}
                  />
                  <Legend verticalAlign="top" height={36}/>
                  <Area type="monotone" dataKey="Receita Acumulada (%)" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.2)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Tabela de Detalhes da Curva ABC por Cliente</CardTitle>
            <CardDescription>
              Classificação detalhada de cada cliente de acordo com sua contribuição para a receita total.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead className="text-right">Receita Total</TableHead>
                  <TableHead className="text-right">% da Receita</TableHead>
                  <TableHead className="text-right">% Acumulada</TableHead>
                  <TableHead className="text-center">Classificação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                        <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                        <TableCell className="text-right"><Skeleton className="h-5 w-24 ml-auto" /></TableCell>
                        <TableCell className="text-right"><Skeleton className="h-5 w-16 ml-auto" /></TableCell>
                        <TableCell className="text-right"><Skeleton className="h-5 w-16 ml-auto" /></TableCell>
                        <TableCell className="text-center"><Skeleton className="h-6 w-12 mx-auto rounded-full" /></TableCell>
                    </TableRow>
                ))}
                {!isLoading && abcData.tableData.map((item) => (
                  <TableRow key={item.clientId}>
                    <TableCell className="font-medium">{item.clientName}</TableCell>
                    <TableCell className="text-right">{formatCurrency(item.totalRevenue)}</TableCell>
                    <TableCell className="text-right">{item.revenuePercentage.toFixed(2)}%</TableCell>
                    <TableCell className="text-right">{item.cumulativeRevenuePercentage.toFixed(2)}%</TableCell>
                    <TableCell className="text-center">
                        <Badge variant="outline" className={cn("font-bold", getClassificationVariant(item.classification))}>
                            {item.classification}
                        </Badge>
                    </TableCell>
                  </TableRow>
                ))}
                 {!isLoading && abcData.tableData.length === 0 && (
                    <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center">
                            Nenhum dado de receita encontrado para análise.
                        </TableCell>
                    </TableRow>
                 )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
