'use server';

/**
 * @fileOverview An AI-powered tool to generate sustainability reports based on project data and environmental metrics.
 *
 * - generateSustainabilityReport - A function that handles the generation of sustainability reports.
 */

import {ai} from '@/ai/genkit';
import {
  GenerateSustainabilityReportInputSchema,
  GenerateSustainabilityReportOutputSchema,
  type GenerateSustainabilityReportInput,
  type GenerateSustainabilityReportOutput,
} from '@/lib/types';


export async function generateSustainabilityReport(
  input: GenerateSustainabilityReportInput
): Promise<GenerateSustainabilityReportOutput> {
  return generateSustainabilityReportFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateSustainabilityReportPrompt',
  input: {schema: GenerateSustainabilityReportInputSchema},
  output: {schema: GenerateSustainabilityReportOutputSchema},
  prompt: `You are a sustainability expert. You will receive project data and environmental metrics and have to generate a sustainability report.

  Pay attention to local regulations in Minas Gerais, Brazil.

  Project Data: {{{projectData}}}
  Environmental Metrics: {{{environmentalMetrics}}}
  Context: {{{context}}}

  Based on the above information, generate a comprehensive sustainability report that communicates the project's environmental impact to stakeholders.
  Include all relavant metrics and suggestions for improvements.
  Always make sure the report complies with local regulations.
  `,
});

const generateSustainabilityReportFlow = ai.defineFlow(
  {
    name: 'generateSustainabilityReportFlow',
    inputSchema: GenerateSustainabilityReportInputSchema,
    outputSchema: GenerateSustainabilityReportOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
