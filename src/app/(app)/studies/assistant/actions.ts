'use server';

import { askAssistant } from '@/ai/flows/assistant-flow';
import type { AssistantInput } from '@/lib/types';

export async function handleAskAssistant(
  data: AssistantInput
): Promise<{ success: boolean; response?: string; error?: string }> {
  try {
    const result = await askAssistant(data);
    if (result && result.response) {
      return { success: true, response: result.response };
    }
    return { success: false, error: 'Falha ao obter resposta. A resposta da IA estava vazia.' };
  } catch (e) {
    console.error(e);
    const errorMessage = e instanceof Error ? e.message : 'Ocorreu um erro desconhecido.';
    return { success: false, error: `Falha ao obter resposta: ${errorMessage}` };
  }
}
