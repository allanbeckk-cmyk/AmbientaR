
'use server';
/**
 * @fileOverview Fluxo de IA para análise ambiental geoespacial.
 *
 * - analyseArea - Função que recebe dados geoespaciais e retorna um relatório de análise.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import {
    AnaliseAmbientalInputSchema,
    AnaliseAmbientalOutputSchema,
    type AnaliseAmbientalInput,
    type AnaliseAmbientalOutput,
} from '@/lib/types/analise-ambiental';


// Mock de Ferramentas (Simulando APIs externas)
const getDadosCAR = ai.defineTool(
  {
    name: 'getDadosCAR',
    description: 'Obtém dados detalhados do Cadastro Ambiental Rural (CAR) a partir do número do recibo.',
    inputSchema: z.object({ numeroCAR: z.string() }),
    outputSchema: z.object({
      areaTotal: z.number(),
      situacao: z.string(),
      appDeclarada: z.number(),
      reservaLegalDeclarada: z.number(),
    }),
  },
  async ({ numeroCAR }) => {
    console.log(`Buscando dados para o CAR: ${numeroCAR}`);
    // Em um cenário real, isso faria uma chamada para a API do SICAR
    return {
      areaTotal: 50.45,
      situacao: 'Ativo',
      appDeclarada: 5.2,
      reservaLegalDeclarada: 10.1,
    };
  }
);

const analisarSobreposicao = ai.defineTool(
  {
    name: 'analisarSobreposicao',
    description: 'Analisa a sobreposição de uma área poligonal com camadas de dados geoespaciais como biomas, UCs e hidrografia.',
    inputSchema: z.object({ poligono: z.string().describe("Coordenadas do polígono em formato WKT ou GeoJSON.") }),
    outputSchema: z.object({
      bioma: z.string(),
      sobreposicaoUC: z.object({
        ocorreu: z.boolean(),
        nomeUC: z.string().optional(),
        distanciaKm: z.number().optional(),
      }),
      hidrografia: z.array(z.object({ nome: z.string(), tipo: z.string() })),
    }),
  },
  async ({ poligono }) => {
    console.log(`Analisando sobreposição para o polígono...`);
    // Simula uma análise geoespacial
    return {
      bioma: 'Cerrado',
      sobreposicaoUC: {
        ocorreu: false,
        nomeUC: 'Parque Estadual da Serra do Cabral',
        distanciaKm: 15,
      },
      hidrografia: [{ nome: "Córrego do Brejo", tipo: "Intermitente" }],
    };
  }
);


// Prompt Principal
const prompt = ai.definePrompt({
  name: 'analiseAmbientalPrompt',
  input: { schema: z.object({ input: AnaliseAmbientalInputSchema }) },
  output: { schema: AnaliseAmbientalOutputSchema },
  tools: [getDadosCAR, analisarSobreposicao],
  prompt: `Você é o "AmbientaR", um assistente de IA especialista em consultoria ambiental, com foco profundo na legislação, normas e procedimentos de Minas Gerais e do Brasil. Sua tarefa é realizar uma análise completa de uma área de empreendimento e gerar um relatório técnico estruturado, preciso e prático.

  O usuário fornecerá a área de uma das seguintes formas:
  1.  **Número do CAR:** Use a ferramenta \`getDadosCAR\` para obter as informações básicas e, em seguida, use o polígono do CAR (simulado) para a análise de sobreposição com \`analisarSobreposicao\`.
  2.  **Arquivo KML/SHP ou Polígono:** O dado será um polígono. Use a ferramenta \`analisarSobreposicao\` diretamente.

  Seu relatório final deve seguir a seguinte estrutura, sendo técnico, preciso e citando a fundamentação legal sempre que aplicável (ex: DN COPAM nº 217/2017):
  
  1.  **resumoIA:** Um parágrafo curto e direto, em tom de especialista, resumindo os pontos mais críticos da análise (ex: "A análise da área, localizada no bioma X, indica conformidade com a legislação vigente, não havendo sobreposição com Unidades de Conservação e apresentando situação regular no CAR. Recomenda-se atenção à Área de Preservação Permanente (APP) do Córrego Y.").
  
  2.  **analises (um array de seções):** Para cada seção, gere um objeto com 'titulo' e 'relatorio'.
      *   **Título: Dados do Imóvel (CAR):** Se o input for um CAR, detalhe os dados retornados pela ferramenta \`getDadosCAR\` no campo 'relatorio'. Compare a área de APP e Reserva Legal declarada com os requisitos legais para o bioma e tamanho do imóvel. Se não, indique no 'relatorio' que a análise não partiu de um número de CAR.
      *   **Título: Bioma e Fitofisionomia:** Identifique o bioma predominante retornado pela ferramenta \`analisarSobreposicao\`. No campo 'relatorio', disserte sobre as implicações legais, como o percentual de Reserva Legal exigido.
      *   **Título: Recursos Hídricos e APP:** Liste os corpos d'água identificados pela ferramenta \`analisarSobreposicao\`. No campo 'relatorio', mencione a obrigatoriedade de respeitar a Faixa de Preservação Permanente (APP) conforme o Código Florestal (Lei nº 12.651/2012).
      *   **Título: Unidades de Conservação:** Informe se a ferramenta \`analisarSobreposicao\` detectou sobreposição com Unidades de Conservação (UCs). No 'relatorio', explique as restrições ou a distância para a UC mais próxima.
      *   **Título: Análise de Imagens (Simulação):** No 'relatorio', simule uma breve análise de imagens de satélite, descrevendo o uso aparente do solo (pastagem, agricultura, vegetação nativa, etc.).
      *   **Título: Conclusão e Recomendações:** No campo 'relatorio', forneça uma conclusão técnica, apontando possíveis pontos de atenção, necessidade de estudos complementares ou próximos passos para a regularização.`,
});

// Fluxo Principal
const analiseAmbientalFlow = ai.defineFlow(
  {
    name: 'analiseAmbientalFlow',
    inputSchema: AnaliseAmbientalInputSchema,
    outputSchema: AnaliseAmbientalOutputSchema,
  },
  async (input) => {
    const { output } = await prompt({ input });
    if (!output) {
      throw new Error("A IA não conseguiu gerar uma análise.");
    }
    return output;
  }
);

export async function analyseArea(input: AnaliseAmbientalInput): Promise<AnaliseAmbientalOutput> {
  return await analiseAmbientalFlow(input);
}
