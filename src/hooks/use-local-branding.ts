'use client';

import { useState, useEffect, useCallback } from 'react';
import { useFirebase, useMemoFirebase, useDoc } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { CompanySettings } from '@/lib/types';

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
  const [localData, setLocalData] = useState<LocalBranding>(empty);
  const [isLoadingLocal, setIsLoadingLocal] = useState(true);

  const { firestore } = useFirebase();
  const brandingDocRef = useMemoFirebase(
    () => (firestore ? doc(firestore, 'companySettings', 'branding') : null),
    [firestore]
  );
  const { data: firestoreData, isLoading: isLoadingFirestore } = useDoc<CompanySettings>(brandingDocRef);

  const refetch = useCallback(async () => {
    setIsLoadingLocal(true);
    try {
      const res = await fetch('/api/branding');
      const json = await res.json();
      setLocalData({
        headerImageUrl: json.headerImageUrl ?? null,
        footerImageUrl: json.footerImageUrl ?? null,
        watermarkImageUrl: json.watermarkImageUrl ?? null,
        logoUsage: json.logoUsage ?? 'pdf_only',
        systemLogoSource: json.systemLogoSource ?? 'header',
      });
    } catch {
      setLocalData(empty);
    } finally {
      setIsLoadingLocal(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const hasLocalImages = localData.headerImageUrl || localData.footerImageUrl || localData.watermarkImageUrl;

  const data: LocalBranding = hasLocalImages
    ? localData
    : {
        headerImageUrl: firestoreData?.headerImageUrl ?? null,
        footerImageUrl: firestoreData?.footerImageUrl ?? null,
        watermarkImageUrl: firestoreData?.watermarkImageUrl ?? null,
        logoUsage: firestoreData?.logoUsage ?? localData.logoUsage ?? 'pdf_only',
        systemLogoSource: firestoreData?.systemLogoSource ?? localData.systemLogoSource ?? 'header',
      };

  const isLoading = isLoadingLocal || isLoadingFirestore;

  return { data, isLoading, refetch };
}
