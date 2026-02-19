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
import { handleAskAssistant } from './actions';
import { PageHeader } from '@/components/page-header';

const formSchema = z.object({
  prompt: z.string().min(10, 'Sua pergunta deve ter pelo menos 10 caracteres.'),
});

type FormValues = z.infer<typeof formSchema>;

export default function AssistantPage() {
  const [loading, setLoading] = React.useState(false);
  const [response, setResponse] = React.useState<string | null>(null);
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      prompt: '',
    },
  });

  async function onSubmit(values: FormValues) {
    setLoading(true);
    setResponse(null);
    
    const result = await handleAskAssistant(values);

    if (result.success && result.response) {
      setResponse(result.response);
    } else {
      toast({
        variant: 'destructive',
        title: 'Erro na Geração',
        description: result.error || 'Não foi possível obter uma resposta do assistente.',
      });
    }

    setLoading(false);
  }

  return (
     <div className="flex flex-col h-full">
      <PageHeader title="Assistente de IA para Legislação Ambiental" />
      <main className="flex-1 overflow-auto p-4 md:p-6">
        <div className="grid gap-6 lg:grid-cols-2">
            <Card>
                <CardHeader>
                <CardTitle>Consulte o Especialista</CardTitle>
                <CardDescription>
                    Faça sua pergunta sobre legislação, normas ou procedimentos ambientais. O assistente é especializado em normas de Minas Gerais e do Brasil.
                </CardDescription>
                </CardHeader>
                <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                        control={form.control}
                        name="prompt"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Sua Pergunta</FormLabel>
                            <FormControl>
                            <Textarea
                                placeholder="Ex: Quais são os prazos para renovação de uma Licença de Operação (LO) em Minas Gerais e qual a base legal?"
                                className="min-h-[150px]"
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
                            Pensando...
                        </>
                        ) : (
                        <>
                            <Sparkles className="mr-2 h-4 w-4" />
                            Perguntar ao Assistente
                        </>
                        )}
                    </Button>
                    </form>
                </Form>
                </CardContent>
            </Card>
            
            <div className="lg:h-full">
            {(loading || response) && (
                <Card className="h-full flex flex-col">
                <CardHeader>
                    <CardTitle>Resposta do Assistente</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 overflow-auto">
                    {loading && (
                    <div className="flex items-center justify-center h-full">
                        <div className="flex flex-col items-center gap-2 text-muted-foreground">
                            <Loader2 className="w-8 h-8 animate-spin"/>
                            <p>Consultando base de conhecimento e gerando a resposta...</p>
                        </div>
                    </div>
                    )}
                    {response && (
                        <div className="prose dark:prose-invert max-w-none">
                            <pre className="whitespace-pre-wrap font-body text-sm bg-muted p-4 rounded-md">{response}</pre>
                        </div>
                    )}
                </CardContent>
                </Card>
            )}
            </div>
            </div>
      </main>
    </div>
  );
}
