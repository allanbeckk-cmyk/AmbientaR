
import { z } from 'genkit';

// Definição do Esquema de Entrada
export const AnaliseAmbientalInputSchema = z.object({
  dataType: z.enum(['car', 'kml', 'shp', 'polygon']),
  data: z.string().describe('O dado de entrada. Pode ser um número de CAR, conteúdo de arquivo KML/SHP (base64) ou coordenadas de um polígono.'),
});
export type AnaliseAmbientalInput = z.infer<typeof AnaliseAmbientalInputSchema>;


// Definição do Esquema de Saída
const AnaliseDetalhadaSchema = z.object({
  titulo: z.string().describe("Título da seção da análise (ex: 'Recursos Hídricos')."),
  relatorio: z.string().describe("Análise textual detalhada, dados e conclusões da IA para esta seção."),
});

export const AnaliseAmbientalOutputSchema = z.object({
  resumoIA: z.string().describe("Um resumo executivo de 2 a 3 frases com as conclusões mais importantes da análise completa."),
  analises: z.array(AnaliseDetalhadaSchema).describe("Uma lista de análises detalhadas para cada camada de informação."),
});
export type AnaliseAmbientalOutput = z.infer<typeof AnaliseAmbientalOutputSchema>;
