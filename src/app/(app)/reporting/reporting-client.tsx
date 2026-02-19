'use client';

import * as React from 'react';
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
import { handleGenerateReport } from './actions';
import { useToast } from '@/hooks/use-toast';
import { GenerateSustainabilityReportInputSchema, type GenerateSustainabilityReportInput } from '@/lib/types';

const formSchema = GenerateSustainabilityReportInputSchema;

type FormValues = GenerateSustainabilityReportInput;

export default function ReportingClient() {
  const [loading, setLoading] = React.useState(false);
  const [report, setReport] = React.useState<string | null>(null);
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      projectData: '',
      environmentalMetrics: '',
      context: '',
    },
  });

  async function onSubmit(values: FormValues) {
    setLoading(true);
    setReport(null);
    
    const result = await handleGenerateReport(values);

    if (result.success && result.report) {
      setReport(result.report);
    } else {
      toast({
        variant: 'destructive',
        title: 'Erro na Geração',
        description: result.error || 'Não foi possível gerar o relatório.',
      });
    }

    setLoading(false);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Gerador de Relatório de Sustentabilidade</CardTitle>
          <CardDescription>
            Insira os dados do projeto e as métricas ambientais para gerar um relatório de sustentabilidade detalhado.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="projectData"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dados do Projeto</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Descreva as atividades do projeto, recursos utilizados, localização, etc."
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Detalhes sobre as atividades e recursos do projeto.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="environmentalMetrics"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Métricas Ambientais</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Ex: Emissões de CO2 (ton), consumo de água (m³), resíduos gerados (kg)."
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Dados quantitativos de impacto ambiental.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="context"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contexto Adicional (Opcional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Informações sobre a comunidade local, regulamentações específicas aplicáveis, etc."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Gerando...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Gerar Relatório de Sustentabilidade
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
                    <p>Analisando dados e compilando o relatório...</p>
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
