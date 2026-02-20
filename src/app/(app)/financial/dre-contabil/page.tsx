'use client';

import * as React from 'react';
import { useMemo, useState, useRef } from 'react';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import type { Invoice, Revenue, Expense } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { BarChart2, TrendingUp, TrendingDown, Minus, FileDown, Printer, Link2 } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import jsPDF from 'jspdf';
import { useToast } from '@/hooks/use-toast';
import { fetchBrandingImageAsBase64 } from '@/lib/branding-pdf';
import { useLocalBranding } from '@/hooks/use-local-branding';

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

/** Retorna YYYY-MM-DD para comparação segura; string vazia se inválido */
function datePart(dateStr: string | undefined): string {
  if (dateStr == null || dateStr === '') return '';
  const s = String(dateStr).slice(0, 10);
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
}

export default function DreContabilPage() {
  const [selectedYear, setSelectedYear] = useState<string>(String(currentYear));
  const printRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { firestore, user } = useFirebase();
  const { data: brandingData } = useLocalBranding();

  const invoicesQuery = useMemoFirebase(
    () => (firestore && user ? collection(firestore, 'invoices') : null),
    [firestore, user]
  );
  const { data: invoices, isLoading: isLoadingInvoices } = useCollection<Invoice>(invoicesQuery);

  const revenuesQuery = useMemoFirebase(
    () => (firestore && user ? collection(firestore, 'revenues') : null),
    [firestore, user]
  );
  const { data: revenues, isLoading: isLoadingRevenues } = useCollection<Revenue>(revenuesQuery);

  const expensesQuery = useMemoFirebase(
    () => (firestore && user ? collection(firestore, 'expenses') : null),
    [firestore, user]
  );
  const { data: expenses, isLoading: isLoadingExpenses } = useCollection<Expense>(expensesQuery);

  const dre = useMemo(() => {
    const year = parseInt(selectedYear, 10);
    if (Number.isNaN(year) || !invoices || !revenues || !expenses) return null;

    const start = `${year}-01-01`;
    const end = `${year}-12-31`;

    const inPeriod = (part: string) => part >= start && part <= end;

    const receitaFaturas = invoices
      .filter((i) => i.status === 'Paid' && inPeriod(datePart(i.invoiceDate)))
      .reduce((acc, i) => acc + (Number(i.amount) || 0), 0);

    const receitaCaixa = revenues
      .filter((r) => inPeriod(datePart(r.date)))
      .reduce((acc, r) => acc + (Number(r.amount) || 0), 0);

    const receitaBruta = receitaFaturas + receitaCaixa;
    const deducoes = 0;
    const receitaLiquida = receitaBruta - deducoes;
    const despesasOperacionais = expenses
      .filter((e) => inPeriod(datePart(e.date)))
      .reduce((acc, e) => acc + (Number(e.amount) || 0), 0);
    const resultadoOperacional = receitaLiquida - despesasOperacionais;
    const outrasReceitasDespesas = 0;
    const resultadoLiquido = resultadoOperacional + outrasReceitasDespesas;

    return {
      receitaBruta,
      deducoes,
      receitaLiquida,
      despesasOperacionais,
      resultadoOperacional,
      outrasReceitasDespesas,
      resultadoLiquido,
      receitaFaturas,
      receitaCaixa,
    };
  }, [selectedYear, invoices, revenues, expenses]);

  const isLoading = isLoadingInvoices || isLoadingRevenues || isLoadingExpenses;

  const handleExportPdf = async () => {
    if (!dre) return;
    const headerBase64 = await fetchBrandingImageAsBase64(brandingData?.headerImageUrl);
    const footerBase64 = await fetchBrandingImageAsBase64(brandingData?.footerImageUrl);
    const watermarkBase64 = await fetchBrandingImageAsBase64(brandingData?.watermarkImageUrl);

    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    const contentWidth = pageWidth - margin * 2;
    let y = 20;
    if (headerBase64) {
      doc.addImage(headerBase64, 'PNG', margin, 10, contentWidth, 30);
      y = 50;
    }
    if (watermarkBase64) {
      const imgProps = doc.getImageProperties(watermarkBase64);
      const aspectRatio = imgProps.width / imgProps.height;
      const w = 100;
      const h = w / aspectRatio;
      doc.addImage(watermarkBase64, 'PNG', (pageWidth - w) / 2, (pageHeight - h) / 2, w, h, undefined, 'FAST');
    }
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Demonstração do Resultado do Exercício (DRE)', pageWidth / 2, y, { align: 'center' });
    y += 10;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(`Exercício: ${selectedYear}`, pageWidth / 2, y, { align: 'center' });
    y += 15;
    doc.setFontSize(10);
    const lines = [
      ['1. Receita Bruta de Serviços', formatCurrency(dre.receitaBruta)],
      ['   Faturas recebidas (pagas)', formatCurrency(dre.receitaFaturas)],
      ['   Receitas de caixa', formatCurrency(dre.receitaCaixa)],
      ['2. Deduções da Receita', `(${formatCurrency(dre.deducoes)})`],
      ['3. Receita Líquida', formatCurrency(dre.receitaLiquida)],
      ['4. Despesas Operacionais', `(${formatCurrency(dre.despesasOperacionais)})`],
      ['5. Resultado Operacional', formatCurrency(dre.resultadoOperacional)],
      ['6. Outras receitas / (despesas)', formatCurrency(dre.outrasReceitasDespesas)],
      ['7. Resultado Líquido do Exercício', formatCurrency(dre.resultadoLiquido)],
    ];
    lines.forEach(([label, value]) => {
      doc.setFont('helvetica', label.startsWith('   ') ? 'normal' : label.startsWith('7.') ? 'bold' : 'normal');
      doc.text(label, margin, y);
      doc.text(value, pageWidth - margin, y, { align: 'right' });
      y += 7;
    });
    if (footerBase64) {
      doc.addImage(footerBase64, 'PNG', 10, pageHeight - 20, pageWidth - 20, 15);
    }
    doc.save(`DRE_Contabil_${selectedYear}.pdf`);
    toast({ title: 'PDF exportado', description: 'Arquivo DRE_Contabil_' + selectedYear + '.pdf' });
  };

  const handlePrint = () => {
    if (!printRef.current) return;
    const content = printRef.current.innerHTML;
    const win = window.open('', '_blank');
    if (!win) {
      toast({ variant: 'destructive', title: 'Erro', description: 'Permita pop-ups para imprimir.' });
      return;
    }
    const html = '<!DOCTYPE html><html><head><meta charset="utf-8"><title>DRE Contábil ' + selectedYear + '</title>' +
      '<style>body{font-family:system-ui,sans-serif;padding:20px;max-width:800px;margin:0 auto}' +
      'table{width:100%;border-collapse:collapse}th,td{border:1px solid #ddd;padding:8px;text-align:left}' +
      '.text-right{text-align:right}.font-bold{font-weight:700}.mt-4{margin-top:16px}</style></head><body>' +
      '<h1>Demonstração do Resultado do Exercício (DRE)</h1><p><strong>Exercício:</strong> ' + selectedYear + '</p>' +
      content + '</body></html>';
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); win.close(); }, 250);
    toast({ title: 'Impressão', description: 'Use a janela de impressão do navegador.' });
  };

  return (
    <div className="flex flex-col h-full">
      <PageHeader title="DRE Contábil">
        <div className="flex flex-wrap items-center gap-2">
          <Label className="text-sm text-muted-foreground">Exercício:</Label>
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {years.map((y) => (
                <SelectItem key={y} value={String(y)}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {dre && (
            <>
              <Button variant="outline" size="sm" onClick={handleExportPdf}>
                <FileDown className="h-4 w-4 mr-2" />
                Exportar PDF
              </Button>
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="h-4 w-4 mr-2" />
                Imprimir
              </Button>
            </>
          )}
        </div>
      </PageHeader>

      <main className="flex-1 overflow-auto p-4 md:p-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart2 className="h-5 w-5" />
              Demonstração do Resultado do Exercício (DRE)
            </CardTitle>
            <CardDescription>
              Resultado do exercício com base nos lançamentos já cadastrados no menu Financeiro: <strong>Faturas</strong> (recebidas/pagas) e <strong>Lançamentos de Caixa</strong> (receitas e despesas). Os valores são coletados automaticamente dessas fontes para o ano selecionado.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : dre ? (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[60%]">Descrição</TableHead>
                      <TableHead className="text-right">Valor ({selectedYear})</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium">1. Receita Bruta de Serviços</TableCell>
                      <TableCell className="text-right">{formatCurrency(dre.receitaBruta)}</TableCell>
                    </TableRow>
                    <TableRow className="bg-muted/30">
                      <TableCell className="pl-8 text-muted-foreground">
                        Faturas recebidas (pagas)
                      </TableCell>
                      <TableCell className="text-right">{formatCurrency(dre.receitaFaturas)}</TableCell>
                    </TableRow>
                    <TableRow className="bg-muted/30">
                      <TableCell className="pl-8 text-muted-foreground">
                        Receitas de caixa (lançamentos)
                      </TableCell>
                      <TableCell className="text-right">{formatCurrency(dre.receitaCaixa)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">2. Deduções da Receita</TableCell>
                      <TableCell className="text-right">({formatCurrency(dre.deducoes)})</TableCell>
                    </TableRow>
                    <TableRow className="border-b-2 border-primary/30">
                      <TableCell className="font-semibold">3. Receita Líquida</TableCell>
                      <TableCell className="text-right font-semibold">{formatCurrency(dre.receitaLiquida)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">4. Despesas Operacionais</TableCell>
                      <TableCell className="text-right">({formatCurrency(dre.despesasOperacionais)})</TableCell>
                    </TableRow>
                    <TableRow className="border-b-2 border-primary/30">
                      <TableCell className="font-semibold">5. Resultado Operacional</TableCell>
                      <TableCell className="text-right font-semibold">{formatCurrency(dre.resultadoOperacional)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">6. Outras receitas / (despesas)</TableCell>
                      <TableCell className="text-right">{formatCurrency(dre.outrasReceitasDespesas)}</TableCell>
                    </TableRow>
                    <TableRow className="bg-primary/10 border-t-2 border-primary">
                      <TableCell className="font-bold text-base">7. Resultado Líquido do Exercício</TableCell>
                      <TableCell className="text-right font-bold text-base">{formatCurrency(dre.resultadoLiquido)}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>

                <p className="text-xs text-muted-foreground mt-4 flex items-center gap-1">
                  <Link2 className="h-3 w-3" />
                  Dados integrados ao menu Financeiro: Faturas (receita faturada paga) e Lançamentos de Caixa (receitas e despesas).
                </p>

                <div className="mt-6 flex flex-wrap gap-4">
                  <Card className="flex-1 min-w-[180px]">
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-2 text-muted-foreground text-sm">
                        <TrendingUp className="h-4 w-4" />
                        Receita Líquida
                      </div>
                      <p className="text-xl font-semibold mt-1">{formatCurrency(dre.receitaLiquida)}</p>
                    </CardContent>
                  </Card>
                  <Card className="flex-1 min-w-[180px]">
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-2 text-muted-foreground text-sm">
                        <TrendingDown className="h-4 w-4" />
                        Despesas
                      </div>
                      <p className="text-xl font-semibold mt-1">{formatCurrency(dre.despesasOperacionais)}</p>
                    </CardContent>
                  </Card>
                  <Card className="flex-1 min-w-[180px]">
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-2 text-muted-foreground text-sm">
                        <Minus className="h-4 w-4" />
                        Resultado Líquido
                      </div>
                      <p className={`text-xl font-semibold mt-1 ${dre.resultadoLiquido >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {formatCurrency(dre.resultadoLiquido)}
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </>
            ) : (
              <p className="text-muted-foreground text-center py-8">Nenhum dado disponível para o período.</p>
            )}
          </CardContent>
        </Card>

        {dre && (
          <div ref={printRef} className="hidden">
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr><th style={{ textAlign: 'left', padding: 8, border: '1px solid #ddd' }}>Descrição</th><th style={{ textAlign: 'right', padding: 8, border: '1px solid #ddd' }}>Valor ({selectedYear})</th></tr>
              </thead>
              <tbody>
                <tr><td style={{ padding: 8, border: '1px solid #ddd' }}>1. Receita Bruta de Serviços</td><td style={{ textAlign: 'right', padding: 8, border: '1px solid #ddd' }}>{formatCurrency(dre.receitaBruta)}</td></tr>
                <tr><td style={{ padding: 8, border: '1px solid #ddd', paddingLeft: 24 }}>Faturas recebidas (pagas)</td><td style={{ textAlign: 'right', padding: 8, border: '1px solid #ddd' }}>{formatCurrency(dre.receitaFaturas)}</td></tr>
                <tr><td style={{ padding: 8, border: '1px solid #ddd', paddingLeft: 24 }}>Receitas de caixa (lançamentos)</td><td style={{ textAlign: 'right', padding: 8, border: '1px solid #ddd' }}>{formatCurrency(dre.receitaCaixa)}</td></tr>
                <tr><td style={{ padding: 8, border: '1px solid #ddd' }}>2. Deduções da Receita</td><td style={{ textAlign: 'right', padding: 8, border: '1px solid #ddd' }}>({formatCurrency(dre.deducoes)})</td></tr>
                <tr><td style={{ padding: 8, border: '1px solid #ddd', fontWeight: 600 }}>3. Receita Líquida</td><td style={{ textAlign: 'right', padding: 8, border: '1px solid #ddd', fontWeight: 600 }}>{formatCurrency(dre.receitaLiquida)}</td></tr>
                <tr><td style={{ padding: 8, border: '1px solid #ddd' }}>4. Despesas Operacionais</td><td style={{ textAlign: 'right', padding: 8, border: '1px solid #ddd' }}>({formatCurrency(dre.despesasOperacionais)})</td></tr>
                <tr><td style={{ padding: 8, border: '1px solid #ddd', fontWeight: 600 }}>5. Resultado Operacional</td><td style={{ textAlign: 'right', padding: 8, border: '1px solid #ddd', fontWeight: 600 }}>{formatCurrency(dre.resultadoOperacional)}</td></tr>
                <tr><td style={{ padding: 8, border: '1px solid #ddd' }}>6. Outras receitas / (despesas)</td><td style={{ textAlign: 'right', padding: 8, border: '1px solid #ddd' }}>{formatCurrency(dre.outrasReceitasDespesas)}</td></tr>
                <tr><td style={{ padding: 8, border: '1px solid #ddd', fontWeight: 700 }}>7. Resultado Líquido do Exercício</td><td style={{ textAlign: 'right', padding: 8, border: '1px solid #ddd', fontWeight: 700 }}>{formatCurrency(dre.resultadoLiquido)}</td></tr>
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
