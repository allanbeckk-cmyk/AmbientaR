'use server';

import {
  generateSustainabilityReport,
} from '@/ai/flows/generate-sustainability-report';
import { generateFinancialReport } from '@/ai/flows/generate-financial-report';
import type { GenerateSustainabilityReportInput, GenerateFinancialReportInput } from '@/lib/types';

export async function handleGenerateReport(
  data: GenerateSustainabilityReportInput
): Promise<{ success: boolean; report?: string; error?: string }> {
  try {
    const result = await generateSustainabilityReport(data);
    if (result && result.report) {
      return { success: true, report: result.report };
    }
    return { success: false, error: 'Falha ao gerar o relatório. A resposta da IA estava vazia.' };
  } catch (e) {
    console.error(e);
    const errorMessage = e instanceof Error ? e.message : 'Ocorreu um erro desconhecido.';
    return { success: false, error: `Falha ao gerar o relatório: ${errorMessage}` };
  }
}

export async function handleGenerateFinancialReport(
  data: GenerateFinancialReportInput
): Promise<{ success: boolean; report?: string; error?: string }> {
  try {
    const result = await generateFinancialReport(data);
    if (result && result.report) {
      return { success: true, report: result.report };
    }
    return { success: false, error: 'Falha ao gerar o relatório financeiro. A resposta da IA estava vazia.' };
  } catch (e) {
    console.error(e);
    const errorMessage = e instanceof Error ? e.message : 'Ocorreu um erro desconhecido.';
    return { success: false, error: `Falha ao gerar o relatório: ${errorMessage}` };
  }
}
