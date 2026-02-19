'use client';
import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { DollarSign, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collection } from 'firebase/firestore';
import type { Revenue, Expense, Transaction } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';


export function CashFlowChart() {
  const firestore = useFirestore();
  const { user } = useUser();
  const revenuesQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return collection(firestore, 'revenues');
  }, [firestore, user]);
  const expensesQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return collection(firestore, 'expenses');
  }, [firestore, user]);

  const { data: revenuesData, isLoading: isLoadingRevenues } = useCollection<Revenue>(revenuesQuery);
  const { data: expensesData, isLoading: isLoadingExpenses } = useCollection<Expense>(expensesQuery);

  const { dashboardStats, chartData } = useMemo(() => {
    const revenues = revenuesData || [];
    const expenses = expensesData || [];

    const allTransactions: Transaction[] = [
      ...revenues.map((r) => ({ ...r, type: 'revenue' as const })),
      ...expenses.map((e) => ({ ...e, type: 'expense' as const })),
    ];

    const totalRevenue = revenues.reduce((acc, r) => acc + r.amount, 0);
    const totalExpenses = expenses.reduce((acc, e) => acc + e.amount, 0);
    const totalProfit = totalRevenue - totalExpenses;

    const monthlyData: { [key: string]: { revenue: number, expenses: number } } = {};
    const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

    allTransactions.forEach(transaction => {
      const date = new Date(transaction.date);
      const month = monthNames[date.getMonth()];
      if (!month) return;

      if (!monthlyData[month]) {
        monthlyData[month] = { revenue: 0, expenses: 0 };
      }
      if (transaction.type === 'revenue') {
          monthlyData[month].revenue += transaction.amount;
      } else {
          monthlyData[month].expenses += transaction.amount;
      }
    });

    const chartData = monthNames.map(month => ({
      month,
      Receita: monthlyData[month]?.revenue || 0,
      Despesa: monthlyData[month]?.expenses || 0,
    })).slice(0, new Date().getMonth() + 1);


    return {
      dashboardStats: {
        revenue: totalRevenue,
        expenses: totalExpenses,
        profit: totalProfit,
      },
      chartData,
    };
  }, [revenuesData, expensesData]);


  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);

  const isLoading = isLoadingRevenues || isLoadingExpenses;

  return (
    <>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
              <TrendingUp className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              {isLoading ? <Skeleton className="h-8 w-3/4" /> : <div className="text-2xl font-bold">{formatCurrency(dashboardStats.revenue)}</div>}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Despesas Totais</CardTitle>
              <TrendingDown className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              {isLoading ? <Skeleton className="h-8 w-3/4" /> : <div className="text-2xl font-bold">{formatCurrency(dashboardStats.expenses)}</div>}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Lucro Líquido</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? <Skeleton className="h-8 w-3/4" /> : <div className="text-2xl font-bold">{formatCurrency(dashboardStats.profit)}</div>}
            </CardContent>
          </Card>
        </div>
        <Card>
            <CardHeader>
              <CardTitle>Visão Geral do Fluxo de Caixa</CardTitle>
              <CardDescription>Receitas vs. Despesas ao longo do ano.</CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
              {isLoading ? <div className="w-full h-[350px] flex items-center justify-center"><Skeleton className="w-full h-full"/></div> :
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${formatCurrency(value as number)}`} />
                  <Tooltip formatter={(value) => formatCurrency(value as number)} />
                  <Legend />
                  <Bar dataKey="Receita" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Despesa" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
              }
            </CardContent>
        </Card>
    </>
  );
}
