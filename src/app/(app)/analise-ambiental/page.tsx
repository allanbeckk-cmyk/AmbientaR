
'use client';

import * as React from 'react';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Sparkles, Globe, FileText, Upload } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { analyseArea } from '@/ai/flows/analise-ambiental-flow';
import type { AnaliseAmbientalOutput, AnaliseAmbientalInput } from '@/lib/types/analise-ambiental';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

export default function AnaliseAmbientalPage() {
  const [isLoading, setIsLoading] = React.useState(false);
  const [analysisResult, setAnalysisResult] = React.useState<AnaliseAmbientalOutput | null>(null);
  const [userInput, setUserInput] = React.useState('');
  const { toast } = useToast();

  const handleStartAnalysis = async () => {
    setIsLoading(true);
    setAnalysisResult(null);

    if (!userInput) {
        toast({ variant: 'destructive', title: 'Dados insuficientes', description: 'Por favor, cole os dados da sua análise (CAR, coordenadas, etc.) na área de texto.' });
        setIsLoading(false);
        return;
    }
    
    // A IA agora precisa determinar o tipo de dado.
    // O ideal seria ter um campo para o usuário selecionar o tipo.
    // Por enquanto, vamos assumir que a IA pode inferir ou que o usuário descreve.
    const input: AnaliseAmbientalInput = { 
        dataType: 'car', // A IA irá refinar isso, é um placeholder
        data: userInput 
    };
    
    try {
        const result = await analyseArea(input);
        setAnalysisResult(result);
    } catch (error) {
        console.error("Analysis failed:", error);
        toast({
            variant: 'destructive',
            title: 'Erro na Análise',
            description: error instanceof Error ? error.message : 'Ocorreu um erro desconhecido.'
        });
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <PageHeader title="Análise Ambiental Geoespacial com IA" />
      <main className="flex-1 overflow-auto p-4 md:p-6 grid gap-8 md:grid-cols-2">
        
        {/* Input Column */}
        <div className="flex flex-col gap-6">
          <Card className='flex-1 flex flex-col'>
            <CardHeader>
              <CardTitle>Geovizualizador IDE-SisemaNet</CardTitle>
              <CardDescription>Utilize o mapa para explorar, localizar um imóvel pelo CAR ou desenhar um polígono. Em seguida, copie os dados relevantes (número do CAR, coordenadas, etc.) e cole no campo abaixo para a IA analisar.</CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
                <iframe 
                    src="https://visualizador.idesisema.meioambiente.mg.gov.br/"
                    className="w-full h-full border rounded-md"
                    title="IDE-SisemaNet Geoviewer"
                ></iframe>
            </CardContent>
          </Card>
          
           <Card>
            <CardHeader>
              <CardTitle>Iniciar Análise com IA</CardTitle>
              <CardDescription>Cole os dados do mapa acima para que o assistente especialista "AmbientaR" possa processá-los e gerar um relatório técnico.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                 <div className="space-y-2">
                    <Label htmlFor="analysis-input">Dados para Análise</Label>
                    <Textarea 
                        id="analysis-input"
                        placeholder="Ex: MG-3106200-ABC123... ou as coordenadas de um polígono."
                        value={userInput}
                        onChange={(e) => setUserInput(e.target.value)}
                        className="min-h-[100px]"
                    />
                </div>
                 <Button onClick={handleStartAnalysis} disabled={isLoading || !userInput} className="w-full">
                    {isLoading ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Analisando...
                    </>
                    ) : (
                    <>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Gerar Relatório de Análise
                    </>
                    )}
                </Button>
            </CardContent>
          </Card>

        </div>

        {/* Result Column */}
        <div className="flex flex-col gap-6">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Relatório da Análise</CardTitle>
              <CardDescription>Resultados consolidados e análise de IA sobre a área selecionada.</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <Loader2 className="w-8 h-8 animate-spin"/>
                        <p>O assistente "AmbientaR" está processando os dados...</p>
                    </div>
                </div>
              ) : analysisResult ? (
                <div className="space-y-6">
                    <Alert>
                        <Sparkles className="h-4 w-4" />
                        <AlertTitle className="font-semibold">Resumo do Especialista</AlertTitle>
                        <AlertDescription>{analysisResult.resumoIA}</AlertDescription>
                    </Alert>
                    
                    <div className="space-y-2">
                        {analysisResult.analises.map((item, index) => (
                             <Card key={index}>
                                <CardHeader className="p-4">
                                  <CardTitle className="text-base">{item.titulo}</CardTitle>
                                </CardHeader>
                                <CardContent className="p-4 pt-0 text-sm text-muted-foreground prose prose-sm dark:prose-invert max-w-none">
                                  {/* Usando <pre> para manter a formatação do relatório, incluindo quebras de linha */}
                                  <pre className="whitespace-pre-wrap font-body">{item.relatorio}</pre>
                                </CardContent>
                              </Card>
                        ))}
                    </div>
                     <Button variant="secondary" className="w-full">
                        <FileText className="mr-2 h-4 w-4" />
                        Exportar Relatório Completo (PDF)
                    </Button>
                </div>
              ) : (
                 <div className="flex flex-col items-center justify-center text-center h-full text-muted-foreground p-8">
                    <Globe className="w-12 h-12 mb-4" />
                    <h3 className="text-lg font-semibold">Aguardando Análise</h3>
                    <p className="text-sm">Use o mapa do IDE-SisemaNet, cole os dados no campo à esquerda e inicie a análise para ver os resultados aqui.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
