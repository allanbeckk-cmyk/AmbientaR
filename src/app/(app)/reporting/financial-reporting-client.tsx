'use client';

import * as React from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { handleGenerateFinancialReport } from './actions';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import type { Revenue, Expense } from '@/lib/types';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { GenerateFinancialReportInputSchema } from '@/lib/types';


const formSchema = GenerateFinancialReportInputSchema.extend({
  startDate: z.date({ required_error: 'A data inicial é obrigatória.' }),
  endDate: z.date({ required_error: 'A data final é obrigatória.' }),
}).refine(data => data.endDate > data.startDate, {
  message: 'A data final deve ser posterior à data inicial.',
  path: ['endDate'],
});

type FormValues = z.infer<typeof formSchema>;

export default function FinancialReportingClient() {
  const [loading, setLoading] = React.useState(false);
  const [report, setReport] = React.useState<string | null>(null);
  const { toast } = useToast();
  const firestore = useFirestore();

  const revenuesQuery = useMemoFirebase(() => firestore ? collection(firestore, 'revenues') : null, [firestore]);
  const { data: revenuesData, isLoading: isLoadingRevenues } = useCollection<Revenue>(revenuesQuery);
  const expensesQuery = useMemoFirebase(() => firestore ? collection(firestore, 'expenses') : null, [firestore]);
  const { data: expensesData, isLoading: isLoadingExpenses } = useCollection<Expense>(expensesQuery);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      context: '',
    },
  });

  async function onSubmit(values: FormValues) {
    setLoading(true);
    setReport(null);

    const filteredRevenues = revenuesData?.filter(r => {
      const date = new Date(r.date);
      return date >= values.startDate && date <= values.endDate;
    }) || [];
    
    const filteredExpenses = expensesData?.filter(e => {
        const date = new Date(e.date);
        return date >= values.startDate && date <= values.endDate;
    }) || [];
    
    if (filteredRevenues.length === 0 && filteredExpenses.length === 0) {
        toast({
            variant: 'destructive',
            title: 'Nenhum dado encontrado',
            description: 'Não há receitas ou despesas no período selecionado para gerar um relatório.',
        });
        setLoading(false);
        return;
    }

    const result = await handleGenerateFinancialReport({
      revenues: JSON.stringify(filteredRevenues),
      expenses: JSON.stringify(filteredExpenses),
      context: values.context,
    });

    if (result.success && result.report) {
      setReport(result.report);
    } else {
      toast({
        variant: 'destructive',
        title: 'Erro na Geração',
        description: result.error || 'Não foi possível gerar o relatório financeiro.',
      });
    }

    setLoading(false);
  }

  const isLoadingData = isLoadingRevenues || isLoadingExpenses;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Gerador de Relatório Financeiro</CardTitle>
          <CardDescription>
            Selecione um período para gerar um relatório financeiro e contábil com base nos lançamentos de caixa.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                        <FormItem className="flex flex-col">
                        <FormLabel>Data Inicial</FormLabel>
                        <Popover>
                            <PopoverTrigger asChild>
                            <FormControl>
                                <Button
                                variant={"outline"}
                                className={cn(
                                    "w-full pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                )}
                                >
                                {field.value ? (
                                    format(field.value, "PPP", { locale: ptBR })
                                ) : (
                                    <span>Escolha uma data</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                            </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                disabled={(date) =>
                                date > new Date() || date < new Date("2000-01-01")
                                }
                                initialFocus
                            />
                            </PopoverContent>
                        </Popover>
                        <FormMessage />
                        </FormItem>
                    )}
                 />
                 <FormField
                    control={form.control}
                    name="endDate"
                    render={({ field }) => (
                        <FormItem className="flex flex-col">
                        <FormLabel>Data Final</FormLabel>
                        <Popover>
                            <PopoverTrigger asChild>
                            <FormControl>
                                <Button
                                variant={"outline"}
                                className={cn(
                                    "w-full pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                )}
                                >
                                {field.value ? (
                                    format(field.value, "PPP", { locale: ptBR })
                                ) : (
                                    <span>Escolha uma data</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                            </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                disabled={(date) =>
                                date > new Date() || date < new Date("2000-01-01")
                                }
                                initialFocus
                            />
                            </PopoverContent>
                        </Popover>
                        <FormMessage />
                        </FormItem>
                    )}
                 />
              </div>

              <FormField
                control={form.control}
                name="context"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Instruções Adicionais (Opcional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Ex: 'Focar na análise de custos operacionais' ou 'Gerar um resumo para a declaração de impostos'."
                        {...field}
                      />
                    </FormControl>
                     <FormDescription>
                      Forneça instruções específicas para a IA focar em pontos de interesse.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={loading || isLoadingData}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Gerando Relatório...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Gerar Relatório Financeiro
                  </>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
      
      <div className="lg:h-full">
      {(loading || report) && (
        <Card className="h-full flex flex-col">
          <CardHeader>
            <CardTitle>Relatório Gerado</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-auto">
            {loading && (
              <div className="flex items-center justify-center h-full">
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Loader2 className="w-8 h-8 animate-spin"/>
                    <p>Analisando dados financeiros e compilando o relatório...</p>
                </div>
              </div>
            )}
            {report && (
                <div className="prose dark:prose-invert max-w-none">
                    <pre className="whitespace-pre-wrap font-body text-sm bg-muted p-4 rounded-md">{report}</pre>
                </div>
            )}
          </CardContent>
        </Card>
      )}
      </div>
    </div>
  );
}
