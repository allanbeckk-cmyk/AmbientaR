'use client';

import * as React from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, FileDown, Printer } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const tabelaDiagnosticoSchema = z.object({
  aspecto: z.string(),
  inicial: z.string(),
  atual: z.string(),
  conformidade: z.enum(['Sim', 'Não']),
});

const formSchema = z.object({
  data: z.date({ required_error: 'Informe a data do relatório.' }),
  processo: z.string().min(1, 'Processo MPMG é obrigatório.'),
  prad: z.string().min(1, 'PRAD/PTFR SEMAD é obrigatório.'),
  empreendedor: z.string().min(1, 'Empreendedor é obrigatório.'),
  localizacao: z.string().min(1, 'Localização é obrigatória.'),
  sumario: z.string().optional(),
  fundamentacao: z.string().optional(),
  q1: z.enum(['Sim', 'Não', 'Parcial']),
  q2: z.string().optional(),
  cobertura: z.coerce.number().min(0).max(100).optional(),
  q4: z.string().optional(),
  visitas: z.string().optional(),
  tabela: z.array(tabelaDiagnosticoSchema),
  conclusoes: z.string().optional(),
  recomendacoes: z.string().optional(),
  perito: z.string().min(1, 'Nome do perito é obrigatório.'),
  assinatura: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface PtrfPradFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

const defaultTabela = [
  { aspecto: 'Área (ha)', inicial: '', atual: '', conformidade: 'Sim' as const },
  { aspecto: 'Cobertura (%)', inicial: '', atual: '', conformidade: 'Sim' as const },
  { aspecto: 'Mortalidade mudas', inicial: '', atual: '', conformidade: 'Sim' as const },
];

function buildPdf(doc: jsPDF, values: FormValues) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  let y = 15;

  doc.setFont('times', 'normal');
  doc.setFontSize(14);
  doc.text('RELATÓRIO PERICIAL DE ACOMPANHAMENTO DE EXECUÇÃO DE PRAD/PTFR', pageWidth / 2, y, { align: 'center' });
  y += 8;
  doc.setFontSize(10);
  doc.text('Relatório de Vistória de Acompanhamento de PRAD/PTRF', pageWidth / 2, y, { align: 'center' });
  y += 5;
  doc.text(`Data: ${format(values.data, 'dd/MM/yyyy', { locale: ptBR })}`, pageWidth / 2, y, { align: 'center' });
  y += 12;

  doc.setFont('times', 'bold');
  doc.setFontSize(11);
  doc.text('1. Identificação do Processo', margin, y);
  y += 6;
  doc.setFont('times', 'normal');
  doc.setFontSize(10);
  doc.text(`Processo MPMG nº: ${values.processo}`, margin, y);
  y += 5;
  doc.text(`PRAD/PTFR SEMAD nº: ${values.prad}`, margin, y);
  y += 5;
  doc.text(`Empreendedor (Nome/CNPJ): ${values.empreendedor}`, margin, y);
  y += 5;
  doc.text(`Localização (Município/Coords): ${values.localizacao}`, margin, y);
  y += 10;

  if (values.sumario) {
    doc.setFont('times', 'bold');
    doc.text('2. Sumário Executivo', margin, y);
    y += 6;
    doc.setFont('times', 'normal');
    const sumarioLines = doc.splitTextToSize(values.sumario, pageWidth - 2 * margin);
    doc.text(sumarioLines, margin, y);
    y += sumarioLines.length * 5 + 8;
  }

  if (values.fundamentacao) {
    doc.setFont('times', 'bold');
    doc.text('3. Fundamentação Legal', margin, y);
    y += 6;
    doc.setFont('times', 'normal');
    const fundLines = doc.splitTextToSize(values.fundamentacao, pageWidth - 2 * margin);
    doc.text(fundLines, margin, y);
    y += fundLines.length * 5 + 8;
  }

  doc.setFont('times', 'bold');
  doc.text('4. Quesitos Periciais', margin, y);
  y += 6;
  doc.setFont('times', 'normal');
  doc.text(`Q1 - Execução segue PRAD?: ${values.q1}`, margin, y);
  y += 5;
  if (values.q2) {
    const q2Lines = doc.splitTextToSize(`Q2 - Atrasos no cronograma?: ${values.q2}`, pageWidth - 2 * margin);
    doc.text(q2Lines, margin, y);
    y += q2Lines.length * 5 + 2;
  } else y += 5;
  doc.text(`Q3 - Cobertura vegetal atual (%): ${values.cobertura ?? '-'}`, margin, y);
  y += 5;
  if (values.q4) {
    const q4Lines = doc.splitTextToSize(`Q4 - Outros: ${values.q4}`, pageWidth - 2 * margin);
    doc.text(q4Lines, margin, y);
    y += q4Lines.length * 5 + 8;
  } else y += 8;

  doc.setFont('times', 'bold');
  doc.text('5. Metodologia e Diagnóstico', margin, y);
  y += 6;
  doc.setFont('times', 'normal');
  doc.text(`Visitas in loco (datas): ${values.visitas ?? '-'}`, margin, y);
  y += 8;

  const tableBody = values.tabela.map((row) => [row.aspecto, row.inicial, row.atual, row.conformidade]);
  autoTable(doc, {
    startY: y,
    head: [['Aspecto', 'Inicial', 'Atual', 'Conformidade']],
    body: tableBody,
    theme: 'grid',
    headStyles: { fillColor: [56, 142, 60], fontStyle: 'normal' },
    margin: { left: margin, right: margin },
  });
  const docWithTable = doc as jsPDF & { lastAutoTable?: { finalY: number } };
  y = (docWithTable.lastAutoTable?.finalY ?? y) + 10;

  if (values.conclusoes) {
    doc.setFont('times', 'bold');
    doc.text('6. Conclusões e Recomendações', margin, y);
    y += 6;
    doc.setFont('times', 'normal');
    doc.text('Conclusões:', margin, y);
    y += 5;
    const conclLines = doc.splitTextToSize(values.conclusoes, pageWidth - 2 * margin);
    doc.text(conclLines, margin, y);
    y += conclLines.length * 5 + 5;
  }
  if (values.recomendacoes) {
    doc.text('Recomendações:', margin, y);
    y += 5;
    const recLines = doc.splitTextToSize(values.recomendacoes, pageWidth - 2 * margin);
    doc.text(recLines, margin, y);
    y += recLines.length * 5 + 12;
  }

  doc.setFont('times', 'normal');
  doc.text(`Perito: ${values.perito}`, pageWidth - margin, y, { align: 'right' });
  y += 5;
  if (values.assinatura) {
    doc.text(`Assinatura Digital: ${values.assinatura}`, pageWidth - margin, y, { align: 'right' });
  }
}

export function PtrfPradForm({ onSuccess, onCancel }: PtrfPradFormProps) {
  const [loading, setLoading] = React.useState(false);
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      data: new Date(),
      processo: '',
      prad: '',
      empreendedor: '',
      localizacao: '',
      sumario: '',
      fundamentacao: '',
      q1: 'Sim',
      q2: '',
      cobertura: undefined,
      q4: '',
      visitas: '',
      tabela: defaultTabela,
      conclusoes: '',
      recomendacoes: '',
      perito: 'Allan Pimenta - CREA/MG [XXX]',
      assinatura: '',
    },
  });

  const handleGeneratePdf = form.handleSubmit((values) => {
    try {
      const doc = new jsPDF({ unit: 'mm', format: 'a4' });
      buildPdf(doc, values);
      doc.save('Relatorio-Pericial-PRAD-PTFR-Paracatu.pdf');
      toast({ title: 'PDF gerado', description: 'O relatório foi baixado com sucesso.' });
    } catch (e) {
      console.error(e);
      toast({ variant: 'destructive', title: 'Erro ao gerar PDF', description: 'Tente novamente.' });
    }
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <Form {...form}>
      <form className="space-y-6">
        <FormField
          control={form.control}
          name="data"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Data do relatório</FormLabel>
              <FormControl>
                <Input
                  type="date"
                  value={field.value ? format(field.value, 'yyyy-MM-dd') : ''}
                  onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : undefined)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Card>
          <CardHeader>
            <CardTitle>1. Identificação do Processo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="processo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Processo MPMG nº</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Ex.: 12345.000000/2025-0" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="prad"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>PRAD/PTFR SEMAD nº</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Nº do PRAD/PTFR na SEMAD" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="empreendedor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Empreendedor (Nome/CNPJ)</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Nome ou razão social e CNPJ" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="localizacao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Localização (Município/Coords)</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Ex.: Paracatu-MG, UTM XX/YY" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>2. Sumário Executivo</CardTitle>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="sumario"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Resumo (conformidade, % execução, irregularidades)</FormLabel>
                  <FormControl>
                    <Textarea {...field} rows={4} placeholder="Resuma conformidade, % execução, irregularidades..." />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>3. Fundamentação Legal</CardTitle>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="fundamentacao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Normas aplicáveis</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      rows={3}
                      placeholder="DN COPAM 217/2017, Decreto 48.127/2021, IN IBAMA 14/2024..."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>4. Quesitos Periciais</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="q1"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Q1 - Execução segue PRAD?</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Sim">Sim</SelectItem>
                      <SelectItem value="Não">Não</SelectItem>
                      <SelectItem value="Parcial">Parcial</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="q2"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Q2 - Atrasos no cronograma?</FormLabel>
                  <FormControl>
                    <Textarea {...field} rows={2} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="cobertura"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Q3 - Cobertura vegetal atual (%)</FormLabel>
                  <FormControl>
                    <Input type="number" min={0} max={100} {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="q4"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Q4 - Outros</FormLabel>
                  <FormControl>
                    <Textarea {...field} rows={2} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>5. Metodologia e Diagnóstico</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="visitas"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Visitas in loco (datas)</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Ex.: 10/01/2026, 15/02/2026" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Aspecto</TableHead>
                    <TableHead>Inicial</TableHead>
                    <TableHead>Atual</TableHead>
                    <TableHead>Conformidade</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {form.watch('tabela').map((row, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{row.aspecto}</TableCell>
                      <TableCell>
                        <FormField
                          control={form.control}
                          name={`tabela.${index}.inicial`}
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input {...field} className="h-8" />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </TableCell>
                      <TableCell>
                        <FormField
                          control={form.control}
                          name={`tabela.${index}.atual`}
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input {...field} className="h-8" />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </TableCell>
                      <TableCell>
                        <FormField
                          control={form.control}
                          name={`tabela.${index}.conformidade`}
                          render={({ field }) => (
                            <FormItem>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger className="h-8">
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="Sim">Sim</SelectItem>
                                  <SelectItem value="Não">Não</SelectItem>
                                </SelectContent>
                              </Select>
                            </FormItem>
                          )}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>6. Conclusões e Recomendações</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="conclusoes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Conclusões (respostas aos quesitos)</FormLabel>
                  <FormControl>
                    <Textarea {...field} rows={4} placeholder="Respostas aos quesitos..." />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="recomendacoes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Recomendações</FormLabel>
                  <FormControl>
                    <Textarea {...field} rows={3} placeholder="Adequações em X dias, multas..." />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Assinatura</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="perito"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Perito</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Nome - CREA/MG [XXX]" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="assinatura"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Assinatura Digital (opcional)</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Ex.: CPF ou identificação" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
            Cancelar
          </Button>
          <Button type="button" variant="outline" onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            Imprimir / Preview
          </Button>
          <Button type="button" onClick={handleGeneratePdf} disabled={loading}>
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <FileDown className="mr-2 h-4 w-4" />
            )}
            Gerar e Baixar PDF
          </Button>
        </div>
      </form>
    </Form>
  );
}
