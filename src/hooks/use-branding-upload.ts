'use client';

import { useCallback } from 'react';
import { useToast } from './use-toast';

interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

type BrandingField = 'headerImageUrl' | 'footerImageUrl' | 'watermarkImageUrl';

export function useUploadBrandingImage() {
  const { toast } = useToast();

  const upload = useCallback(
    async (file: File, fieldName: BrandingField): Promise<UploadResult> => {
      try {
        const formData = new FormData();
        formData.set('fieldName', fieldName);
        formData.set('file', file);

        const res = await fetch('/api/branding', {
          method: 'POST',
          body: formData,
        });

        const json = await res.json();

        if (!res.ok) {
          toast({
            variant: 'destructive',
            title: 'Erro no upload',
            description: json.error || 'Falha ao salvar imagem.',
          });
          return { success: false, error: json.error };
        }

        if (!json.success || !json.url) {
          toast({
            variant: 'destructive',
            title: 'Erro no upload',
            description: 'Resposta inválida do servidor.',
          });
          return { success: false, error: 'Resposta inválida' };
        }

        return { success: true, url: json.url };
      } catch (error: any) {
        const message = error?.message || 'Falha ao enviar arquivo.';
        toast({
          variant: 'destructive',
          title: 'Erro no upload',
          description: message,
        });
        return { success: false, error: message };
      }
    },
    [toast]
  );

  return { upload };
}
