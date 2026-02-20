
'use client';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
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
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal, PlusCircle, Pencil, Trash2, Eye, FileText, FileDown, Printer } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCollection, useFirebase, useMemoFirebase, errorEmitter, useDoc, useAuth } from '@/firebase';
import { collection, doc, deleteDoc, query, where } from 'firebase/firestore';
import { fetchBrandingImageAsBase64 } from '@/lib/branding-pdf';
import { useLocalBranding } from '@/hooks/use-local-branding';
import type { Invoice, Client, CompanySettings, Contract } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
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
import { useToast } from '@/hooks/use-toast';
import { FirestorePermissionError } from '@/firebase/errors';
import jsPDF from 'jspdf';
import { logUserAction } from '@/lib/audit-log';
import { InvoiceForm } from './invoice-form';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search } from 'lucide-react';

const DetailItem = ({ label, value }: { label: string, value?: string | null | number }) => (
    <div className="space-y-1">
        <Label className="text-sm font-medium">{label}</Label>
        <p className="text-sm text-muted-foreground">{value || 'Não informado'}</p>
    </div>
);


type PeriodType = 'day' | 'month' | 'year';

function isInvoiceInPeriod(invoice: Invoice, periodType: PeriodType, periodValue: string): boolean {
    if (!periodValue) return true;
    const d = new Date(invoice.invoiceDate);
    if (periodType === 'day') {
        const dayStr = d.toISOString().slice(0, 10);
        return dayStr === periodValue;
    }
    if (periodType === 'month') {
        const monthStr = d.toISOString().slice(0, 7);
        return monthStr === periodValue;
    }
    if (periodType === 'year') {
        return String(d.getFullYear()) === periodValue;
    }
    return true;
}

export default function InvoicesPage() {
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isViewOpen, setIsViewOpen] = useState(false);
    const [isAlertOpen, setIsAlertOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<string | null>(null);
    const [editingItem, setEditingItem] = useState<Invoice | null>(null);
    const [viewingItem, setViewingItem] = useState<Invoice | null>(null);
    const [periodType, setPeriodType] = useState<PeriodType>('month');
    const [periodDay, setPeriodDay] = useState<string>(() => new Date().toISOString().slice(0, 10));
    const [periodMonth, setPeriodMonth] = useState<string>(() => new Date().toISOString().slice(0, 7));
    const [periodYear, setPeriodYear] = useState<string>(() => String(new Date().getFullYear()));
    const [viewGroup, setViewGroup] = useState<'a_lancar' | 'por_periodo'>('a_lancar');
    const [periodYearFilter, setPeriodYearFilter] = useState<string>(() => String(new Date().getFullYear()));
    const [periodMonthFilter, setPeriodMonthFilter] = useState<string>('');
    const [filterCliente, setFilterCliente] = useState('');
    const [filterDataInicio, setFilterDataInicio] = useState('');
    const [filterDataFim, setFilterDataFim] = useState('');
    const [filterValorMin, setFilterValorMin] = useState('');
    const [filterValorMax, setFilterValorMax] = useState('');
    const [filterNumero, setFilterNumero] = useState('');
    const router = useRouter();

    const { firestore, auth, user } = useFirebase();
    const { toast } = useToast();

    const invoicesQuery = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        if(user.role === 'admin' || user.role === 'financial' || user.role === 'supervisor') {
            return collection(firestore, 'invoices');
        }
        // Clientes podem ver suas próprias faturas - a lógica de filtro real pode ser mais complexa
        return query(collection(firestore, 'invoices'));

    }, [firestore, user]);

    const { data: invoices, isLoading: isLoadingInvoices } = useCollection<Invoice>(invoicesQuery);
    
    const clientsQuery = useMemoFirebase(() => firestore ? collection(firestore, 'clients') : null, [firestore]);
    const { data: clients, isLoading: isLoadingClients } = useCollection<Client>(clientsQuery);
    const clientsMap = useMemo(() => new Map(clients?.map(c => [c.id, c])), [clients]);

    const contractsQuery = useMemoFirebase(() => firestore ? collection(firestore, 'contracts') : null, [firestore]);
    const { data: contracts, isLoading: isLoadingContracts } = useCollection<Contract>(contractsQuery);
    const contractsMap = useMemo(() => new Map(contracts?.map(c => [c.id, c])), [contracts]);


    const { data: brandingData, isLoading: isLoadingBranding } = useLocalBranding();

    const isLoading = isLoadingInvoices || isLoadingClients || isLoadingBranding || isLoadingContracts;

    const sortedInvoices = useMemo(() => {
        if (!invoices) return [];
        return [...invoices].sort((a, b) => {
            return b.invoiceNumber.localeCompare(a.invoiceNumber, undefined, { numeric: true, sensitivity: 'base' });
        });
    }, [invoices]);

    const periodValue = periodType === 'day' ? periodDay : periodType === 'month' ? periodMonth : periodYear;
    const invoicesInPeriod = useMemo(() => {
        if (!periodValue) return sortedInvoices;
        return sortedInvoices.filter((inv) => isInvoiceInPeriod(inv, periodType, periodValue));
    }, [sortedInvoices, periodType, periodValue]);

    const invoicesToLaunch = useMemo(() =>
        sortedInvoices.filter((inv) => inv.status === 'Unpaid' || inv.status === 'Overdue'),
        [sortedInvoices]
    );
    const invoicesByPeriod = useMemo(() => {
        return sortedInvoices.filter((inv) => {
            const raw = inv.invoiceDate;
            if (!raw) return false;
            const d = new Date(raw);
            if (Number.isNaN(d.getTime())) return false;
            const y = String(d.getFullYear());
            if (y !== periodYearFilter) return false;
            if (!periodMonthFilter) return true;
            const m = String(d.getMonth() + 1).padStart(2, '0');
            return m === periodMonthFilter;
        });
    }, [sortedInvoices, periodYearFilter, periodMonthFilter]);
    const currentGroupList = viewGroup === 'a_lancar' ? invoicesToLaunch : invoicesByPeriod;
    const filteredInvoices = useMemo(() => {
        return currentGroupList.filter((inv) => {
            const clientName = clientsMap.get(inv.clientId)?.name ?? '';
            if (filterCliente.trim()) {
                if (!clientName.toLowerCase().includes(filterCliente.trim().toLowerCase())) return false;
            }
            if (filterNumero.trim()) {
                if (!inv.invoiceNumber.toLowerCase().includes(filterNumero.trim().toLowerCase())) return false;
            }
            if (filterDataInicio) {
                const invDate = (inv.invoiceDate || '').slice(0, 10);
                if (invDate < filterDataInicio) return false;
            }
            if (filterDataFim) {
                const invDate = (inv.invoiceDate || '').slice(0, 10);
                if (invDate > filterDataFim) return false;
            }
            const vMin = filterValorMin !== '' ? parseFloat(filterValorMin) : null;
            const vMax = filterValorMax !== '' ? parseFloat(filterValorMax) : null;
            if (vMin != null && !Number.isNaN(vMin) && inv.amount < vMin) return false;
            if (vMax != null && !Number.isNaN(vMax) && inv.amount > vMax) return false;
            return true;
        });
    }, [currentGroupList, clientsMap, filterCliente, filterNumero, filterDataInicio, filterDataFim, filterValorMin, filterValorMax]);

    const handleAddNew = () => {
        setEditingItem(null);
        setIsFormOpen(true);
    };

    const handleEdit = (item: Invoice) => {
        setEditingItem(item);
        setIsFormOpen(true);
    };
    
    const handleView = (item: Invoice) => {
        setViewingItem(item);
        setIsViewOpen(true);
    };


    const openDeleteConfirm = (itemId: string) => {
        setItemToDelete(itemId);
        setIsAlertOpen(true);
    };

    const handleDelete = () => {
        if (!firestore || !auth || !itemToDelete) return;
        
        const docRef = doc(firestore, 'invoices', itemToDelete);
        const deletedItem = invoices?.find(inv => inv.id === itemToDelete);

        deleteDoc(docRef)
        .then(() => {
            toast({
            title: 'Fatura deletada',
            description: 'A fatura foi removida com sucesso.',
            });
            if(deletedItem) {
                logUserAction(firestore, auth, 'delete_invoice', { invoiceId: itemToDelete, invoiceNumber: deletedItem.invoiceNumber });
            }
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

    const handleExportPdf = async (invoice: Invoice) => {
        const client = clientsMap.get(invoice.clientId);
        const contract = invoice.contractId ? contractsMap.get(invoice.contractId) : null;
        const doc = new jsPDF({ unit: 'mm', format: 'a4' });
        
        const headerBase64 = await fetchBrandingImageAsBase64(brandingData?.headerImageUrl);
        const footerBase64 = await fetchBrandingImageAsBase64(brandingData?.footerImageUrl);
        const watermarkBase64 = await fetchBrandingImageAsBase64(brandingData?.watermarkImageUrl);


        const pageHeight = doc.internal.pageSize.getHeight();
        const pageWidth = doc.internal.pageSize.getWidth();
        const margins = { top: 15, bottom: 25, left: 15, right: 15 };
        const contentWidth = pageWidth - margins.left - margins.right;

        // Header
        if (headerBase64) {
            doc.addImage(headerBase64, 'PNG', margins.left, 10, contentWidth, 30);
        }
        
        // Watermark
        if (watermarkBase64) {
            const imgProps = doc.getImageProperties(watermarkBase64);
            const aspectRatio = imgProps.width / imgProps.height;
            const watermarkWidth = 100;
            const watermarkHeight = watermarkWidth / aspectRatio;
            const x = (pageWidth - watermarkWidth) / 2;
            const y = (pageHeight - watermarkHeight) / 2;
            doc.addImage(watermarkBase64, 'PNG', x, y, watermarkWidth, watermarkHeight, undefined, 'FAST');
        }
        
        let yPos = headerBase64 ? 50 : 20;

        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.text(`FATURA #${invoice.invoiceNumber}`, pageWidth / 2, yPos, { align: 'center' });
        yPos += 15;
        
        // Dates Box
        doc.setDrawColor(230, 230, 230);
        doc.setLineWidth(0.5);
        doc.roundedRect(margins.left, yPos, contentWidth, 15, 3, 3, 'S');
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text(`Data de Vencimento: ${new Date(invoice.dueDate).toLocaleDateString('pt-BR')}`, margins.left + 5, yPos + 8);
        doc.setFont('helvetica', 'normal');
        doc.text(`Data de Emissão:`, margins.left + contentWidth - 60, yPos + 8);
        doc.text(`${new Date(invoice.invoiceDate).toLocaleDateString('pt-BR')}`, margins.left + contentWidth - 5, yPos + 8, { align: 'right' });
        doc.setLineWidth(0.2);
        yPos += 15 + 2;


        // Client Data Box
        let clientBoxHeight = 15;
        if(client?.address) clientBoxHeight += 5;
        if(client?.phone || client?.email) clientBoxHeight +=5;
        if(client?.cpfCnpj) clientBoxHeight += 5;
        doc.roundedRect(margins.left, yPos, contentWidth, clientBoxHeight, 3, 3, 'S');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.text('Cliente:', margins.left + 5, yPos + 8);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        let clientY = yPos + 15;
        if(client) {
            doc.text(client.name, margins.left + 5, clientY);
            clientY += 5;
            doc.text(`Doc: ${client.cpfCnpj || 'Não informado'}`, margins.left + 5, clientY);
            clientY += 5;
            doc.text(`Contato: ${client.phone || ''} | ${client.email || ''}`, margins.left + 5, clientY);
            clientY += 5;
            const addressString = `${client.address || ''}, ${client.numero || 's/n'} - ${client.bairro || ''}. ${client.municipio || ''}/${client.uf || ''} - CEP: ${client.cep || ''}`;
            doc.text(`Endereço: ${addressString}`, margins.left + 5, clientY);
        }
        yPos += clientBoxHeight + 2;


        // Items Box
        let itemsBoxHeight = 15; // min height
        if (contract && contract.objeto?.itens && contract.objeto.itens.length > 0) {
            itemsBoxHeight += (contract.objeto.itens.length * 6) + 5;
        } else {
            itemsBoxHeight += 10;
        }
        doc.roundedRect(margins.left, yPos, contentWidth, itemsBoxHeight, 3, 3, 'S');
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Descrição dos Serviços:', margins.left + 5, yPos + 8);
        let itemsY = yPos + 15;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        
        if (contract && contract.objeto?.itens && contract.objeto.itens.length > 0) {
            contract.objeto.itens.forEach(item => {
                const splitDescription = doc.splitTextToSize(item.description, 130);
                doc.text(splitDescription, margins.left + 7, itemsY, { align: 'justify' });
                doc.text(formatCurrency(item.valor), margins.left + contentWidth - 7, itemsY, { align: 'right' });
                itemsY += (splitDescription.length * 5) + 4;
            });
        } else {
             doc.text(`Serviços referentes à fatura ${invoice.invoiceNumber}`, margins.left + 7, itemsY);
        }
        yPos += itemsBoxHeight + 2;

        // Total Box
        const totalBoxHeight = 20;
        doc.roundedRect(margins.left, yPos, contentWidth, totalBoxHeight, 3, 3, 'S');
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        const statusText = `Status: ${invoice.status === 'Paid' ? 'Paga' : invoice.status === 'Unpaid' ? 'Pendente' : 'Atrasada'}`;
        doc.text(statusText, margins.left + 5, yPos + 8);

        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        const valorTotalText = 'Valor Total:';
        doc.text(valorTotalText, margins.left + contentWidth - 60, yPos + 8);
        doc.text(formatCurrency(invoice.amount), margins.left + contentWidth - 5, yPos + 8, { align: 'right' });


        // Footer
        if (footerBase64) {
            const totalPages = doc.getNumberOfPages();
            for (let i = 1; i <= totalPages; i++) {
                doc.setPage(i);
                doc.addImage(footerBase64, 'PNG', 10, pageHeight - 20, pageWidth - 20, 15);
            }
        }

        doc.save(`fatura_${invoice.invoiceNumber}.pdf`);
    };

    const formatCurrency = (value: number) =>
        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

    const handleExportPdfByPeriod = async () => {
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
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Relatório de Faturas por Período', pageWidth / 2, y, { align: 'center' });
        y += 8;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        const periodLabel = periodType === 'day' ? periodDay : periodType === 'month' ? periodMonth : periodYear;
        doc.text(`Período: ${periodType === 'day' ? 'Dia ' : periodType === 'month' ? 'Mês ' : 'Ano '}${periodLabel}`, pageWidth / 2, y, { align: 'center' });
        y += 12;
        const cols = ['Fatura', 'Cliente', 'Data', 'Valor', 'Status'];
        const colWidths = [25, 50, 25, 35, 30];
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        let x = margin;
        cols.forEach((c, i) => { doc.text(c, x, y); x += colWidths[i]; });
        y += 7;
        doc.setFont('helvetica', 'normal');
        invoicesInPeriod.forEach((inv) => {
            if (y > 270) { doc.addPage(); y = 20; }
            x = margin;
            const clientName = (clientsMap.get(inv.clientId)?.name || '').slice(0, 22);
            const status = inv.status === 'Paid' ? 'Paga' : inv.status === 'Unpaid' ? 'Pendente' : 'Atrasada';
            doc.text(inv.invoiceNumber, x, y); x += colWidths[0];
            doc.text(clientName, x, y); x += colWidths[1];
            doc.text(new Date(inv.invoiceDate).toLocaleDateString('pt-BR'), x, y); x += colWidths[2];
            doc.text(formatCurrency(inv.amount), x, y); x += colWidths[3];
            doc.text(status, x, y);
            y += 6;
        });
        y += 6;
        doc.setFont('helvetica', 'bold');
        const total = invoicesInPeriod.reduce((s, i) => s + i.amount, 0);
        doc.text(`Total: ${formatCurrency(total)} (${invoicesInPeriod.length} fatura(s))`, margin, y);

        if (footerBase64) {
            const totalPages = doc.getNumberOfPages();
            for (let i = 1; i <= totalPages; i++) {
                doc.setPage(i);
                doc.addImage(footerBase64, 'PNG', 10, pageHeight - 20, pageWidth - 20, 15);
            }
        }
        doc.save(`faturas_periodo_${periodLabel.replace(/-/g, '')}.pdf`);
        toast({ title: 'PDF exportado', description: 'Relatório por período gerado.' });
    };

    const handlePrintByPeriod = () => {
        const rows = invoicesInPeriod.map((inv) => ({
            fatura: inv.invoiceNumber,
            cliente: clientsMap.get(inv.clientId)?.name || '',
            data: new Date(inv.invoiceDate).toLocaleDateString('pt-BR'),
            valor: formatCurrency(inv.amount),
            status: inv.status === 'Paid' ? 'Paga' : inv.status === 'Unpaid' ? 'Pendente' : 'Atrasada',
        }));
        const periodLabel = periodType === 'day' ? periodDay : periodType === 'month' ? periodMonth : periodYear;
        const total = invoicesInPeriod.reduce((s, i) => s + i.amount, 0);
        const tableRows = rows.map((r) => `<tr><td>${r.fatura}</td><td>${r.cliente}</td><td>${r.data}</td><td>${r.valor}</td><td>${r.status}</td></tr>`).join('');
        const win = window.open('', '_blank');
        if (!win) { toast({ variant: 'destructive', title: 'Erro', description: 'Permita pop-ups para imprimir.' }); return; }
        win.document.write(`
            <!DOCTYPE html><html><head><meta charset="utf-8"><title>Faturas - Período</title>
            <style>body{font-family:system-ui,sans-serif;padding:20px;} table{width:100%;border-collapse:collapse;} th,td{border:1px solid #ddd;padding:8px;text-align:left;} .text-right{text-align:right;}</style></head><body>
            <h1>Relatório de Faturas por Período</h1>
            <p><strong>Período:</strong> ${periodType === 'day' ? 'Dia ' : periodType === 'month' ? 'Mês ' : 'Ano '}${periodLabel}</p>
            <table><thead><tr><th>Fatura</th><th>Cliente</th><th>Data</th><th>Valor</th><th>Status</th></tr></thead><tbody>${tableRows}</tbody></table>
            <p><strong>Total:</strong> ${formatCurrency(total)} (${invoicesInPeriod.length} fatura(s))</p>
            </body></html>
        `);
        win.document.close();
        win.focus();
        setTimeout(() => { win.print(); win.close(); }, 250);
        toast({ title: 'Impressão', description: 'Use a janela de impressão do navegador.' });
    };

  return (
    <>
        <div className="flex flex-col h-full">
        <PageHeader title="Faturas">
            <Button size="sm" className="gap-1" onClick={handleAddNew}>
            <PlusCircle className="h-4 w-4" />
            Criar Fatura
            </Button>
        </PageHeader>
        <main className="flex-1 overflow-auto p-4 md:p-6">
            <Card>
            <CardHeader>
                <CardTitle>Gerenciamento de Faturas</CardTitle>
                <CardDescription>Adicione, edite e visualize todas as faturas.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Tabs value={viewGroup} onValueChange={(v) => setViewGroup(v as 'a_lancar' | 'por_periodo')}>
                <TabsList>
                  <TabsTrigger value="a_lancar">Faturas a lançar</TabsTrigger>
                  <TabsTrigger value="por_periodo">Faturas lançadas por período</TabsTrigger>
                </TabsList>
                {viewGroup === 'por_periodo' && (
                  <div className="flex flex-wrap items-center gap-2 mt-3">
                    <Label className="text-sm">Ano:</Label>
                    <Select value={periodYearFilter} onValueChange={setPeriodYearFilter}>
                      <SelectTrigger className="w-[100px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 6 }, (_, i) => new Date().getFullYear() - i).map((y) => (
                          <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Label className="text-sm">Mês:</Label>
                    <Select value={periodMonthFilter || 'todos'} onValueChange={(v) => setPeriodMonthFilter(v === 'todos' ? '' : v)}>
                      <SelectTrigger className="w-[120px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos</SelectItem>
                        {['01','02','03','04','05','06','07','08','09','10','11','12'].map((m, i) => (
                          <SelectItem key={m} value={m}>{['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'][i]}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </Tabs>
              <div className="flex flex-wrap items-end gap-2 p-3 rounded-lg bg-muted/50">
                <Search className="h-4 w-4 text-muted-foreground" />
                <div className="flex flex-wrap items-end gap-2">
                  <div>
                    <Label className="text-xs">Cliente</Label>
                    <Input placeholder="Nome" className="h-8 w-36" value={filterCliente} onChange={(e) => setFilterCliente(e.target.value)} />
                  </div>
                  <div>
                    <Label className="text-xs">Nº Fatura</Label>
                    <Input placeholder="Número" className="h-8 w-28" value={filterNumero} onChange={(e) => setFilterNumero(e.target.value)} />
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
              <div className="flex flex-wrap items-end gap-2 p-3 rounded-lg bg-muted/30">
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
                <Button variant="outline" size="sm" onClick={handleExportPdfByPeriod}>
                  <FileDown className="h-4 w-4 mr-2" />
                  Exportar PDF
                </Button>
                <Button variant="outline" size="sm" onClick={handlePrintByPeriod}>
                  <Printer className="h-4 w-4 mr-2" />
                  Imprimir
                </Button>
              </div>
              <TooltipProvider>
                <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead>Fatura #</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead className="hidden md:table-cell">Data</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {isLoading && Array.from({ length: 5 }).map((_, i) => (
                        <TableRow key={i}>
                            <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                            <TableCell className="hidden md:table-cell"><Skeleton className="h-5 w-20" /></TableCell>
                            <TableCell className="text-right"><Skeleton className="h-5 w-16 ml-auto" /></TableCell>
                            <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                            <TableCell className="text-right"><Skeleton className="h-8 w-32 ml-auto" /></TableCell>
                        </TableRow>
                    ))}
                    {!isLoading && filteredInvoices?.map((invoice) => (
                    <TableRow key={invoice.id}>
                        <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                        <TableCell>{clientsMap.get(invoice.clientId)?.name || 'Cliente não encontrado'}</TableCell>
                        <TableCell className="hidden md:table-cell text-muted-foreground">{new Date(invoice.invoiceDate).toLocaleDateString('pt-BR')}</TableCell>
                        <TableCell className="text-right">{formatCurrency(invoice.amount)}</TableCell>
                        <TableCell>
                        <Badge
                            variant={invoice.status === 'Paid' ? 'default' : invoice.status === 'Unpaid' ? 'secondary' : 'destructive'}
                            className={cn(
                                invoice.status === 'Paid' && 'bg-emerald-500/20 text-emerald-700 border-emerald-500/30 hover:bg-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20',
                                invoice.status === 'Unpaid' && 'bg-blue-500/20 text-blue-700 border-blue-500/30 hover:bg-blue-500/30 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20',
                                invoice.status === 'Overdue' && 'bg-red-500/20 text-red-700 border-red-500/30 hover:bg-red-500/30 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20',
                            )}
                        >
                            {invoice.status === 'Paid' ? 'Paga' : invoice.status === 'Unpaid' ? 'Pendente' : 'Atrasada'}
                        </Badge>
                        </TableCell>
                        <TableCell>
                            <div className="flex items-center justify-end gap-1">
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button variant="ghost" size="icon" onClick={() => handleView(invoice)}>
                                            <Eye className="h-4 w-4" />
                                            <span className="sr-only">Visualizar</span>
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent><p>Visualizar detalhes</p></TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button variant="ghost" size="icon" onClick={() => handleExportPdf(invoice)}>
                                            <FileText className="h-4 w-4" />
                                            <span className="sr-only">Exportar</span>
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent><p>Exportar PDF</p></TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button variant="ghost" size="icon" onClick={() => handleEdit(invoice)}>
                                            <Pencil className="h-4 w-4" />
                                            <span className="sr-only">Editar</span>
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent><p>Editar Fatura</p></TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => openDeleteConfirm(invoice.id)}>
                                            <Trash2 className="h-4 w-4" />
                                            <span className="sr-only">Deletar</span>
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent><p>Deletar Fatura</p></TooltipContent>
                                </Tooltip>
                            </div>
                        </TableCell>
                    </TableRow>
                    ))}
                    {!isLoading && filteredInvoices?.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={6} className="h-24 text-center">
                                {currentGroupList.length === 0
                                    ? (viewGroup === 'a_lancar' ? 'Nenhuma fatura a lançar.' : 'Nenhuma fatura no período.')
                                    : 'Nenhuma fatura corresponde aos filtros.'}
                            </TableCell>
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
            <DialogContent className="sm:max-w-2xl h-full max-h-[90dvh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>{editingItem ? 'Editar Fatura' : 'Nova Fatura'}</DialogTitle>
                    <DialogDescription>
                        {editingItem ? 'Atualize os detalhes da fatura.' : 'Preencha os campos para criar uma nova fatura.'}
                    </DialogDescription>
                </DialogHeader>
                <InvoiceForm currentItem={editingItem} onSuccess={() => setIsFormOpen(false)} />
            </DialogContent>
        </Dialog>
        
        <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
            <DialogContent className="sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle>Detalhes da Fatura #{viewingItem?.invoiceNumber}</DialogTitle>
                    <DialogDescription>
                        Visualização dos dados cadastrados para a fatura.
                    </DialogDescription>
                </DialogHeader>
                {viewingItem && (
                    <div className="max-h-[60vh] overflow-y-auto pr-4 space-y-4">
                        <DetailItem label="Cliente" value={clientsMap.get(viewingItem.clientId)?.name} />
                        <Separator />
                        <div className="grid grid-cols-2 gap-4">
                           <DetailItem label="Data de Emissão" value={new Date(viewingItem.invoiceDate).toLocaleDateString('pt-BR')} />
                           <DetailItem label="Data de Vencimento" value={new Date(viewingItem.dueDate).toLocaleDateString('pt-BR')} />
                        </div>
                        <DetailItem label="Status" value={viewingItem.status} />
                         <Separator />
                        <div className="flex justify-end font-semibold text-lg">
                           <DetailItem label="Valor Total" value={formatCurrency(viewingItem.amount)} />
                        </div>
                         {viewingItem.fileUrl && (
                             <div className="pt-4">
                                <a href={viewingItem.fileUrl} target="_blank" rel="noopener noreferrer" className="text-primary underline flex items-center gap-2">
                                    <FileText className="h-4 w-4" />
                                    Ver Boleto/Comprovante
                                </a>
                             </div>
                         )}

                    </div>
                )}
                 <DialogFooter>
                    <DialogClose asChild>
                        <Button type="button" variant="outline">
                        Fechar
                        </Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>

        <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Esta ação não pode ser desfeita. Isso irá deletar permanentemente a fatura.
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
