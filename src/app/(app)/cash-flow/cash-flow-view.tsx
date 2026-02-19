'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RevenueTable } from './revenue-table';
import { ExpenseTable } from './expense-table';
import { CashFlowChart } from './cash-flow-chart';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileDown, Printer, Search } from 'lucide-react';
import type { Revenue, Expense } from '@/lib/types';

type PeriodType = 'day' | 'month' | 'year';

export type CashFlowViewProps = {
  periodType: PeriodType;
  setPeriodType: (v: PeriodType) => void;
  periodDay: string;
  setPeriodDay: (v: string) => void;
  periodMonth: string;
  setPeriodMonth: (v: string) => void;
  periodYear: string;
  setPeriodYear: (v: string) => void;
  filterCliente: string;
  setFilterCliente: (v: string) => void;
  filterDataInicio: string;
  setFilterDataInicio: (v: string) => void;
  filterDataFim: string;
  setFilterDataFim: (v: string) => void;
  filterValorMin: string;
  setFilterValorMin: (v: string) => void;
  filterValorMax: string;
  setFilterValorMax: (v: string) => void;
  filterDescricao: string;
  setFilterDescricao: (v: string) => void;
  filteredRevenues: Revenue[];
  filteredExpenses: Expense[];
  isLoadingRevenues: boolean;
  isLoadingExpenses: boolean;
  onExportPdf: () => void;
  onPrint: () => void;
};

export function CashFlowView(props: CashFlowViewProps) {
  const router = useRouter();
  const {
    periodType,
    setPeriodType,
    periodDay,
    setPeriodDay,
    periodMonth,
    setPeriodMonth,
    periodYear,
    setPeriodYear,
    filterCliente,
    setFilterCliente,
    filterDataInicio,
    setFilterDataInicio,
    filterDataFim,
    setFilterDataFim,
    filterValorMin,
    setFilterValorMin,
    filterValorMax,
    setFilterValorMax,
    filterDescricao,
    setFilterDescricao,
    filteredRevenues,
    filteredExpenses,
    isLoadingRevenues,
    isLoadingExpenses,
    onExportPdf,
    onPrint,
  } = props;

  return (
    <div className="flex flex-col h-full">
      <PageHeader title="Lançamentos de Caixa">
        <Tabs defaultValue="revenues">
          <TabsList>
            <TabsTrigger value="revenues" onClick={() => router.push('/cash-flow/new?type=revenue')}>+ Receita</TabsTrigger>
            <TabsTrigger value="expenses" onClick={() => router.push('/cash-flow/new?type=expense')}>+ Despesa</TabsTrigger>
          </TabsList>
        </Tabs>
      </PageHeader>
      <main className="flex-1 overflow-auto p-4 md:p-6">
        <div className="flex flex-wrap items-end gap-2 p-3 rounded-lg bg-muted/50 mb-3">
          <Search className="h-4 w-4 text-muted-foreground" />
          <div className="flex flex-wrap items-end gap-2">
            <div>
              <Label className="text-xs">Cliente</Label>
              <Input placeholder="Nome (receitas)" className="h-8 w-36" value={filterCliente} onChange={(e) => setFilterCliente(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">Descrição</Label>
              <Input placeholder="Descrição" className="h-8 w-40" value={filterDescricao} onChange={(e) => setFilterDescricao(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">Data início</Label>
              <Input type="date" className="h-8 w-36" value={filterDataInicio} onChange={(e) => setFilterDataInicio(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">Data fim</Label>
              <Input type="date" className="h-8 w-36" value={filterDataFim} onChange={(e) => setFilterDataFim(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">Valor mín.</Label>
              <Input type="number" placeholder="0" className="h-8 w-24" value={filterValorMin} onChange={(e) => setFilterValorMin(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">Valor máx.</Label>
              <Input type="number" placeholder="0" className="h-8 w-24" value={filterValorMax} onChange={(e) => setFilterValorMax(e.target.value)} />
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-end gap-2 p-3 rounded-lg bg-muted/50 mb-4">
          <Label className="text-sm">Exportar por período:</Label>
          <Select value={periodType} onValueChange={(v) => setPeriodType(v as PeriodType)}>
            <SelectTrigger className="w-[100px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Dia</SelectItem>
              <SelectItem value="month">Mês</SelectItem>
              <SelectItem value="year">Ano</SelectItem>
            </SelectContent>
          </Select>
          {periodType === 'day' && <Input type="date" className="w-[140px]" value={periodDay} onChange={(e) => setPeriodDay(e.target.value)} />}
          {periodType === 'month' && <Input type="month" className="w-[140px]" value={periodMonth} onChange={(e) => setPeriodMonth(e.target.value)} />}
          {periodType === 'year' && (
            <Select value={periodYear} onValueChange={setPeriodYear}>
              <SelectTrigger className="w-[100px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 6 }, (_, i) => new Date().getFullYear() - i).map((y) => (
                  <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Button variant="outline" size="sm" onClick={onExportPdf}>
            <FileDown className="h-4 w-4 mr-2" />
            Exportar PDF
          </Button>
          <Button variant="outline" size="sm" onClick={onPrint}>
            <Printer className="h-4 w-4 mr-2" />
            Imprimir
          </Button>
        </div>
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="revenues">Receitas</TabsTrigger>
            <TabsTrigger value="expenses">Despesas</TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="space-y-4">
            <CashFlowChart />
          </TabsContent>
          <TabsContent value="revenues">
            <Card>
              <CardHeader>
                <CardTitle>Gerenciamento de Receitas</CardTitle>
                <CardDescription>Adicione, edite e visualize todas as entradas de caixa.</CardDescription>
              </CardHeader>
              <CardContent>
                <RevenueTable revenues={filteredRevenues} isLoadingRevenues={isLoadingRevenues} />
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="expenses">
            <Card>
              <CardHeader>
                <CardTitle>Gerenciamento de Despesas</CardTitle>
                <CardDescription>Adicione, edite e visualize todas as saídas de caixa.</CardDescription>
              </CardHeader>
              <CardContent>
                <ExpenseTable expenses={filteredExpenses} isLoadingExpenses={isLoadingExpenses} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
