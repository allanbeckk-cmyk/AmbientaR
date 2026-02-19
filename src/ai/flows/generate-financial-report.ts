'use server';

/**
 * @fileOverview An AI-powered tool to generate financial reports based on revenue and expense data.
 *
 * - generateFinancialReport - A function that handles the generation of financial reports.
 */

import {ai} from '@/ai/genkit';
import {
  GenerateFinancialReportInputSchema,
  GenerateFinancialReportOutputSchema,
  type GenerateFinancialReportInput,
  type GenerateFinancialReportOutput,
} from '@/lib/types';


export async function generateFinancialReport(
  input: GenerateFinancialReportInput
): Promise<GenerateFinancialReportOutput> {
  return generateFinancialReportFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateFinancialReportPrompt',
  input: {schema: GenerateFinancialReportInputSchema},
  output: {schema: GenerateFinancialReportOutputSchema},
  prompt: `You are an expert accountant and financial analyst for a Brazilian environmental consulting firm. Your task is to generate a clear and concise financial report based on the provided revenue and expense data.

  The report should be in Portuguese (Brazil).

  Data:
  - Revenues (Receitas): {{{revenues}}}
  - Expenses (Despesas): {{{expenses}}}
  - Additional Context/Instructions: {{{context}}}

  Structure of the report:
  1.  **Summary (Resumo Geral):**
      - Total Revenue (Receita Total)
      - Total Expenses (Despesa Total)
      - Net Profit/Loss (Lucro/Prejuízo Líquido)
      - Profit Margin (Margem de Lucro)

  2.  **Detailed Breakdown (Detalhamento):**
      - List of all revenues with date, description, and amount.
      - List of all expenses with date, description, and amount.

  3.  **Analysis and Insights (Análise e Percepções):**
      - Provide a brief analysis of the financial performance for the period.
      - Identify the main sources of revenue and the largest expense categories.
      - Offer 1-2 practical suggestions for financial improvement (e.g., cost reduction, revenue diversification).

  4. **Compliance Note (Nota de Conformidade):**
      - Add a concluding sentence stating that the report is for internal management purposes and should be reviewed by a certified accountant for official tax purposes.
  
  Format the output as a clean, readable text report. Use BRL (R$) for currency.
  `,
});

const generateFinancialReportFlow = ai.defineFlow(
  {
    name: 'generateFinancialReportFlow',
    inputSchema: GenerateFinancialReportInputSchema,
    outputSchema: GenerateFinancialReportOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
