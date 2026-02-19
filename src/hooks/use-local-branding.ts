'use client';

import { useState, useEffect, useCallback } from 'react';

export type LocalBranding = {
  headerImageUrl: string | null;
  footerImageUrl: string | null;
  watermarkImageUrl: string | null;
  logoUsage?: 'pdf_only' | 'system_wide';
  systemLogoSource?: 'header' | 'watermark';
};

const empty: LocalBranding = {
  headerImageUrl: null,
  footerImageUrl: null,
  watermarkImageUrl: null,
  logoUsage: 'pdf_only',
  systemLogoSource: 'header',
};

export function useLocalBranding() {
  const [data, setData] = useState<LocalBranding>(empty);
  const [isLoading, setIsLoading] = useState(true);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/branding');
      const json = await res.json();
      setData({
        headerImageUrl: json.headerImageUrl ?? null,
        footerImageUrl: json.footerImageUrl ?? null,
        watermarkImageUrl: json.watermarkImageUrl ?? null,
        logoUsage: json.logoUsage ?? 'pdf_only',
        systemLogoSource: json.systemLogoSource ?? 'header',
      });
    } catch {
      setData(empty);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { data, isLoading, refetch };
}
