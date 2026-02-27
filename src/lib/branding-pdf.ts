'use client';

import { getStorage, ref, getDownloadURL } from 'firebase/storage';

export interface ImageDimensions {
  width: number;
  height: number;
}

/**
 * Retorna as dimensões reais (em pixels) de uma imagem base64.
 */
export function getImageDimensions(base64: string): Promise<ImageDimensions> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => resolve({ width: 0, height: 0 });
    img.src = base64;
  });
}

/**
 * Calcula largura e altura para o PDF preservando a proporção original da imagem.
 * A imagem nunca ultrapassa maxWidthMm. Se a altura calculada ultrapassar
 * maxHeightMm, reduz proporcionalmente pela altura.
 */
export function calcPdfImageSize(
  dims: ImageDimensions,
  maxWidthMm: number,
  maxHeightMm: number
): { w: number; h: number } {
  if (!dims.width || !dims.height) return { w: maxWidthMm, h: maxHeightMm };
  const ratio = dims.width / dims.height;
  let w = Math.min(dims.width * 0.264583, maxWidthMm); // px → mm (96dpi)
  let h = w / ratio;
  if (h > maxHeightMm) {
    h = maxHeightMm;
    w = h * ratio;
  }
  return { w, h };
}

/**
 * Converte uma imagem (URL pública ou caminho no Firebase Storage) em base64
 * para uso em PDFs (cabeçalho, rodapé, marca d'água).
 * - Se não houver URL/path, retorna null (documento fica sem imagem).
 * - Aceita URL completa (ex.: após upload no branding) ou path do Storage.
 */
export async function fetchBrandingImageAsBase64(
  imageUrl: string | null | undefined
): Promise<string | null> {
  if (!imageUrl || typeof imageUrl !== 'string') return null;
  const trimmed = imageUrl.trim();
  if (!trimmed) return null;

  try {
    // Já é data URL (ex.: assinatura)
    if (trimmed.startsWith('data:image')) return trimmed;

    let urlToFetch: string;

    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      // URL absoluta (ex.: download do Firebase Storage)
      urlToFetch = trimmed;
    } else if (trimmed.startsWith('/')) {
      // URL relativa (ex.: /branding/header.png da API/local) — resolver para mesma origem
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      urlToFetch = origin ? origin + trimmed : trimmed;
    } else {
      // Path do Storage (legado)
      const storage = getStorage();
      const imageRef = ref(storage, trimmed);
      urlToFetch = await getDownloadURL(imageRef);
    }

    const response = await fetch(urlToFetch);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const blob = await response.blob();
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Erro ao carregar imagem do branding para PDF:', error);
    return null;
  }
}
