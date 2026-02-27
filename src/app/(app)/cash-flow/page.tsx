'use client';

import * as React from 'react';
import { useMemo, useState } from 'react';
import { useCollection, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import type { Revenue, Expense, Client } from '@/lib/types';
import jsPDF from 'jspdf';
import { useToast } from '@/hooks/use-toast';
import { fetchBrandingImageAsBase64, getImageDimensions, calcPdfImageSize, applyImageOpacity } from '@/lib/branding-pdf';
import { useLocalBranding } from '@/hooks/use-local-branding';
import { CashFlowView } from './cash-flow-view';

type PeriodType = 'day' | 'month' | 'year';

function datePart(s: string | undefined): string {
  if (s == null || s === '') return '';
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
}

function getPeriodBounds(periodType: PeriodType, periodDay: string, periodMonth: string, periodYear: string): { start: string; end: string } {
  if (periodType === 'day') {
    return { start: periodDay, end: periodDay };
  }
  if (periodType === 'month') {
    const [y, m] = periodMonth.split('-').map(Number);
    const lastDay = new Date(y, m, 0).getDate();
    return { start: periodMonth + '-01', end: periodMonth + '-' + String(lastDay).padStart(2, '0') };
  }
  return { start: periodYear + '-01-01', end: periodYear + '-12-31' };
}

export default function CashFlowPage() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user } = useUser();
  const { data: brandingData } = useLocalBranding();

  const [periodType, setPeriodType] = useState<PeriodType>('month');
  const [periodDay, setPeriodDay] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [periodMonth, setPeriodMonth] = useState<string>(() => new Date().toISOString().slice(0, 7));
  const [periodYear, setPeriodYear] = useState<string>(() => String(new Date().getFullYear()));
  const [filterCliente, setFilterCliente] = useState('');
  const [filterDataInicio, setFilterDataInicio] = useState('');
  const [filterDataFim, setFilterDataFim] = useState('');
  const [filterValorMin, setFilterValorMin] = useState('');
  const [filterValorMax, setFilterValorMax] = useState('');
  const [filterDescricao, setFilterDescricao] = useState('');

  const revenuesQuery = useMemoFirebase(() => (firestore && user ? collection(firestore, 'revenues') : null), [firestore, user]);
  const { data: allRevenues, isLoading: isLoadingRevenues } = useCollection<Revenue>(revenuesQuery);
  const expensesQuery = useMemoFirebase(() => (firestore && user ? collection(firestore, 'expenses') : null), [firestore, user]);
  const { data: allExpenses, isLoading: isLoadingExpenses } = useCollection<Expense>(expensesQuery);
  const clientsQuery = useMemoFirebase(() => (firestore ? collection(firestore, 'clients') : null), [firestore]);
  const { data: clients } = useCollection<Client>(clientsQuery);
  const clientsMap = useMemo(() => new Map(clients?.map(c => [c.id, c.name])), [clients]);

  const { start: periodStart, end: periodEnd } = getPeriodBounds(periodType, periodDay, periodMonth, periodYear);
  const revenuesInPeriod = useMemo(() => {
    if (!allRevenues) return [];
    return allRevenues.filter((r) => { const d = datePart(r.date); return d >= periodStart && d <= periodEnd; });
  }, [allRevenues, periodStart, periodEnd]);
  const expensesInPeriod = useMemo(() => {
    if (!allExpenses) return [];
    return allExpenses.filter((e) => { const d = datePart(e.date); return d >= periodStart && d <= periodEnd; });
  }, [allExpenses, periodStart, periodEnd]);

  const filteredRevenues = useMemo(() => {
    if (!allRevenues) return [];
    return allRevenues.filter((r) => {
      if (filterCliente.trim()) {
        const name = clientsMap.get(r.clientId ?? '') ?? '';
        if (!name.toLowerCase().includes(filterCliente.trim().toLowerCase())) return false;
      }
      if (filterDescricao.trim() && !(r.description || '').toLowerCase().includes(filterDescricao.trim().toLowerCase())) return false;
      const d = datePart(r.date);
      if (filterDataInicio && d < filterDataInicio) return false;
      if (filterDataFim && d > filterDataFim) return false;
      const vMin = filterValorMin !== '' ? parseFloat(filterValorMin) : null;
      const vMax = filterValorMax !== '' ? parseFloat(filterValorMax) : null;
      if (vMin != null && !Number.isNaN(vMin) && r.amount < vMin) return false;
      if (vMax != null && !Number.isNaN(vMax) && r.amount > vMax) return false;
      return true;
    });
  }, [allRevenues, clientsMap, filterCliente, filterDescricao, filterDataInicio, filterDataFim, filterValorMin, filterValorMax]);

  const filteredExpenses = useMemo(() => {
    if (!allExpenses) return [];
    return allExpenses.filter((e) => {
      if (filterDescricao.trim() && !(e.description || '').toLowerCase().includes(filterDescricao.trim().toLowerCase())) return false;
      const d = datePart(e.date);
      if (filterDataInicio && d < filterDataInicio) return false;
      if (filterDataFim && d > filterDataFim) return false;
      const vMin = filterValorMin !== '' ? parseFloat(filterValorMin) : null;
      const vMax = filterValorMax !== '' ? parseFloat(filterValorMax) : null;
      if (vMin != null && !Number.isNaN(vMin) && e.amount < vMin) return false;
      if (vMax != null && !Number.isNaN(vMax) && e.amount > vMax) return false;
      return true;
    });
  }, [allExpenses, filterDescricao, filterDataInicio, filterDataFim, filterValorMin, filterValorMax]);

  const formatCurrency = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
  const periodLabel = periodType === 'day' ? periodDay : periodType === 'month' ? periodMonth : periodYear;

  const handleExportPdf = async () => {
    const headerBase64 = await fetchBrandingImageAsBase64(brandingData?.headerImageUrl);
    const footerBase64 = await fetchBrandingImageAsBase64(brandingData?.footerImageUrl);
    const watermarkBase64Raw = await fetchBrandingImageAsBase64(brandingData?.watermarkImageUrl);
    const watermarkBase64 = watermarkBase64Raw ? await applyImageOpacity(watermarkBase64Raw, 0.15) : null;

    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    const contentWidth = pageWidth - margin * 2;
    let y = 20;
    if (headerBase64) {
      const dims = await getImageDimensions(headerBase64);
      const { w, h } = calcPdfImageSize(dims, contentWidth, 30);
      doc.addImage(headerBase64, 'PNG', margin, 10, w, h);
      y = 10 + h + 5;
    }
    if (watermarkBase64) {
      const imgProps = doc.getImageProperties(watermarkBase64);
      const aspectRatio = imgProps.width / imgProps.height;
      const w = 100;
      const h = w / aspectRatio;
      doc.addImage(watermarkBase64, 'PNG', (pageWidth - w) / 2, (pageHeight - h) / 2, w, h, undefined, 'FAST');
    }
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Lançamentos de Caixa por Período', pageWidth / 2, y, { align: 'center' });
    y += 8;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Período: ' + (periodType === 'day' ? 'Dia ' : periodType === 'month' ? 'Mês ' : 'Ano ') + periodLabel, pageWidth / 2, y, { align: 'center' });
    y += 12;
    doc.setFont('helvetica', 'bold');
    doc.text('Receitas', margin, y);
    y += 6;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    revenuesInPeriod.forEach((r) => {
      if (y > 270) { doc.addPage(); y = 20; }
      doc.text(new Date(r.date).toLocaleDateString('pt-BR'), margin, y);
      doc.text((r.description || '').slice(0, 50), margin + 25, y);
      doc.text(formatCurrency(r.amount), pageWidth - margin, y, { align: 'right' });
      y += 6;
    });
    y += 6;
    doc.setFont('helvetica', 'bold');
    doc.text('Total Receitas: ' + formatCurrency(revenuesInPeriod.reduce((s, r) => s + r.amount, 0)), margin, y);
    y += 10;
    doc.setFont('helvetica', 'bold');
    doc.text('Despesas', margin, y);
    y += 6;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    expensesInPeriod.forEach((e) => {
      if (y > 270) { doc.addPage(); y = 20; }
      doc.text(new Date(e.date).toLocaleDateString('pt-BR'), margin, y);
      doc.text((e.description || '').slice(0, 50), margin + 25, y);
      doc.text(formatCurrency(e.amount), pageWidth - margin, y, { align: 'right' });
      y += 6;
    });
    y += 6;
    doc.setFont('helvetica', 'bold');
    doc.text('Total Despesas: ' + formatCurrency(expensesInPeriod.reduce((s, e) => s + e.amount, 0)), margin, y);

    if (footerBase64) {
      const fDims = await getImageDimensions(footerBase64);
      const { w: fw, h: fh } = calcPdfImageSize(fDims, pageWidth - 20, 20);
      const totalPages = doc.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.addImage(footerBase64, 'PNG', 10, pageHeight - fh - 5, fw, fh);
      }
    }
    doc.save('lancamentos_caixa_' + periodLabel.replace(/-/g, '') + '.pdf');
    toast({ title: 'PDF exportado', description: 'Relatório por período gerado.' });
  };

  const handlePrint = () => {
    const revRows = revenuesInPeriod.map((r) => '<tr><td>' + new Date(r.date).toLocaleDateString('pt-BR') + '</td><td>' + (r.description || '').slice(0, 60) + '</td><td class="text-right">' + formatCurrency(r.amount) + '</td></tr>').join('');
    const expRows = expensesInPeriod.map((e) => '<tr><td>' + new Date(e.date).toLocaleDateString('pt-BR') + '</td><td>' + (e.description || '').slice(0, 60) + '</td><td class="text-right">' + formatCurrency(e.amount) + '</td></tr>').join('');
    const totalRev = formatCurrency(revenuesInPeriod.reduce((s, r) => s + r.amount, 0));
    const totalExp = formatCurrency(expensesInPeriod.reduce((s, e) => s + e.amount, 0));
    const periodText = periodType === 'day' ? 'Dia ' : periodType === 'month' ? 'Mês ' : 'Ano ';
    const win = window.open('', '_blank');
    if (!win) { toast({ variant: 'destructive', title: 'Erro', description: 'Permita pop-ups para imprimir.' }); return; }
    const endBody = '</' + 'body></html>';
    const html = '<!DOCTYPE html><html><head><meta charset="utf-8"><title>Lançamentos de Caixa</title>' +
      '<style>body{font-family:system-ui,sans-serif;padding:20px;} table{width:100%;border-collapse:collapse;} th,td{border:1px solid #ddd;padding:8px;} .text-right{text-align:right;}</style></head><body>' +
      '<h1>Lançamentos de Caixa por Período</h1><p><strong>Período:</strong> ' + periodText + periodLabel + '</p>' +
      '<h2>Receitas</h2><table><thead><tr><th>Data</th><th>Descrição</th><th>Valor</th></tr></thead><tbody>' + revRows + '</tbody></table>' +
      '<p><strong>Total Receitas:</strong> ' + totalRev + '</p>' +
      '<h2>Despesas</h2><table><thead><tr><th>Data</th><th>Descrição</th><th>Valor</th></tr></thead><tbody>' + expRows + '</tbody></table>' +
      '<p><strong>Total Despesas:</strong> ' + totalExp + '</p>' + endBody;
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); win.close(); }, 250);
    toast({ title: 'Impressão', description: 'Use a janela de impressão do navegador.' });
  };

  return (
    <CashFlowView
      periodType={periodType}
      setPeriodType={setPeriodType}
      periodDay={periodDay}
      setPeriodDay={setPeriodDay}
      periodMonth={periodMonth}
      setPeriodMonth={setPeriodMonth}
      periodYear={periodYear}
      setPeriodYear={setPeriodYear}
      filterCliente={filterCliente}
      setFilterCliente={setFilterCliente}
      filterDataInicio={filterDataInicio}
      setFilterDataInicio={setFilterDataInicio}
      filterDataFim={filterDataFim}
      setFilterDataFim={setFilterDataFim}
      filterValorMin={filterValorMin}
      setFilterValorMin={setFilterValorMin}
      filterValorMax={filterValorMax}
      setFilterValorMax={setFilterValorMax}
      filterDescricao={filterDescricao}
      setFilterDescricao={setFilterDescricao}
      filteredRevenues={filteredRevenues}
      filteredExpenses={filteredExpenses}
      isLoadingRevenues={isLoadingRevenues}
      isLoadingExpenses={isLoadingExpenses}
      onExportPdf={handleExportPdf}
      onPrint={handlePrint}
    />
  );
}
