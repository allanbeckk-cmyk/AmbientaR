'use client';

import * as React from 'react';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Sparkles, Globe, FileDown } from 'lucide-react';
import { analyseArea } from '@/ai/flows/analise-ambiental-flow';
import type { AnaliseAmbientalOutput, AnaliseAmbientalInput } from '@/lib/types/analise-ambiental';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import jsPDF from 'jspdf';

export default function AnaliseAmbientalPage() {
  const [isLoading, setIsLoading] = React.useState(false);
  const [analysisResult, setAnalysisResult] = React.useState<AnaliseAmbientalOutput | null>(null);
  const [userInput, setUserInput] = React.useState('');
  const { toast } = useToast();

  const handleStartAnalysis = async () => {
    setIsLoading(true);
    setAnalysisResult(null);

    if (!userInput.trim()) {
      toast({ variant: 'destructive', title: 'Dados insuficientes', description: 'Cole os dados do mapa (CAR, coordenadas, etc.) no campo "Iniciar Análise com IA" para a análise geoespacial.' });
      setIsLoading(false);
      return;
    }

    const input: AnaliseAmbientalInput = {
      dataType: 'car',
      data: userInput.trim(),
    };

    try {
      const result = await analyseArea(input);
      setAnalysisResult(result);
      toast({ title: 'Análise concluída', description: 'O relatório está pronto para download em PDF.' });
    } catch (error) {
      console.error('Analysis failed:', error);
      toast({
        variant: 'destructive',
        title: 'Erro na Análise',
        description: error instanceof Error ? error.message : 'Ocorreu um erro ao processar os dados.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadPdf = () => {
    if (!analysisResult) return;
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const margin = 15;
    const pageW = doc.internal.pageSize.getWidth();
    let y = margin;

    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Relatório de Análise Ambiental Geoespacial', pageW / 2, y, { align: 'center' });
    y += 10;

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    const resumoLines = doc.splitTextToSize(analysisResult.resumoIA, pageW - 2 * margin);
    doc.text(resumoLines, margin, y);
    y += resumoLines.length * 6 + 8;

    const lineHeight = 5;
    const maxY = 280;
    analysisResult.analises.forEach((item) => {
      if (y > maxY - 20) {
        doc.addPage();
        y = margin;
      }
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(item.titulo, margin, y);
      y += 7;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const lines = doc.splitTextToSize(item.relatorio, pageW - 2 * margin);
      for (const line of lines) {
        if (y > maxY - 10) {
          doc.addPage();
          y = margin;
        }
        doc.text(line, margin, y);
        y += lineHeight;
      }
      y += 6;
    });

    doc.save(`relatorio-analise-geoespacial-${new Date().toISOString().slice(0, 10)}.pdf`);
    toast({ title: 'PDF gerado', description: 'O arquivo foi baixado.' });
  };

  return (
    <div className="flex flex-col h-full">
      <PageHeader title="Análise Ambiental Geoespacial com IA" />
      <main className="flex-1 overflow-auto p-4 md:p-6 flex flex-col gap-6 max-w-5xl mx-auto w-full">

        {/* 1. Geovizualizador - card maior */}
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Geovizualizador IDE-SisemaNet</CardTitle>
            <CardDescription>
              Use o mapa para explorar, localizar imóvel pelo CAR ou desenhar polígono. Copie os dados (número CAR, coordenadas, etc.) e cole no card &quot;Iniciar Análise com IA&quot; abaixo — esses dados serão enviados para a análise geoespacial com IA.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 min-h-[65vh] p-0">
            <iframe
              src="https://visualizador.idesisema.meioambiente.mg.gov.br/"
              className="w-full h-[62vh] border-0 rounded-b-lg"
              title="IDE-SisemaNet Geoviewer"
            />
          </CardContent>
        </Card>

        {/* 2. Iniciar Análise com IA - integrado à análise geoespacial */}
        <Card>
          <CardHeader>
            <CardTitle>Iniciar Análise com IA</CardTitle>
            <CardDescription>
              Cole aqui os dados obtidos no mapa acima (CAR, coordenadas, polígono). Eles serão usados pela análise ambiental geoespacial com IA para gerar o relatório técnico.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="analysis-input">Dados para análise geoespacial</Label>
              <Textarea
                id="analysis-input"
                placeholder="Ex: número do CAR (MG-3106200-...), coordenadas do polígono ou outros dados do mapa."
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
            <Button onClick={handleStartAnalysis} disabled={isLoading || !userInput.trim()} className="w-full">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analisando...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Gerar relatório de análise geoespacial
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* 3. Relatório - card compacto, download PDF */}
        <Card>
          <CardHeader>
            <CardTitle>Relatório da Análise</CardTitle>
            <CardDescription>
              Quando o relatório for gerado, ele ficará disponível para download em PDF.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                <Loader2 className="w-10 h-10 animate-spin mb-3" />
                <p className="text-sm">Processando dados e gerando análise geoespacial...</p>
              </div>
            ) : analysisResult ? (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground line-clamp-2">{analysisResult.resumoIA}</p>
                <Button onClick={handleDownloadPdf} className="w-full sm:w-auto">
                  <FileDown className="mr-2 h-4 w-4" />
                  Baixar relatório em PDF
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground">
                <Globe className="w-12 h-12 mb-3 opacity-50" />
                <p className="text-sm">Use o Geovizualizador, cole os dados no card acima e clique em &quot;Gerar relatório de análise geoespacial&quot;. O PDF ficará disponível aqui.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
