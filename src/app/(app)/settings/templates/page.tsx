'use client';

import * as React from 'react';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { FileText } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { TemplateUploader } from '../template-uploader';
import { TEMPLATE_CARDS } from './template-config';

export default function TemplatesPage() {
  const [fileNames, setFileNames] = React.useState<Record<string, string | null>>({});
  const [loadingSlugs, setLoadingSlugs] = React.useState<Set<string>>(new Set(TEMPLATE_CARDS.map((c) => c.slug)));

  const refetchOne = React.useCallback(async (slug: string) => {
    setLoadingSlugs((prev) => new Set(prev).add(slug));
    try {
      const res = await fetch(`/api/templates/${slug}`);
      const data = await res.json();
      setFileNames((prev) => ({ ...prev, [slug]: data.fileName ?? null }));
    } catch {
      setFileNames((prev) => ({ ...prev, [slug]: null }));
    } finally {
      setLoadingSlugs((prev) => {
        const next = new Set(prev);
        next.delete(slug);
        return next;
      });
    }
  }, []);

  const refetchAll = React.useCallback(async () => {
    setLoadingSlugs(new Set(TEMPLATE_CARDS.map((c) => c.slug)));
    const entries = await Promise.all(
      TEMPLATE_CARDS.map(async (c) => {
        try {
          const res = await fetch(`/api/templates/${c.slug}`);
          const data = await res.json();
          return [c.slug, data.fileName ?? null] as const;
        } catch {
          return [c.slug, null] as const;
        }
      })
    );
    setFileNames(Object.fromEntries(entries));
    setLoadingSlugs(new Set());
  }, []);

  React.useEffect(() => {
    refetchAll();
  }, [refetchAll]);

  return (
    <div className="flex flex-col h-full">
      <PageHeader title="Templates" />
      <main className="flex-1 overflow-auto p-4 md:p-6">
        <div className="grid gap-8 max-w-4xl mx-auto">
          {TEMPLATE_CARDS.map(({ slug, title, description }) => (
            <Card key={slug} className="border-primary/50 border-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  {title}
                </CardTitle>
                <CardDescription>
                  {description}
                  {' '}
                  Recomendado: use placeholders no DOCX (ex.: {'{{nome_empreendimento}}'}) para preenchimento na exportação.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {loadingSlugs.has(slug) ? (
                  <Skeleton className="h-32 w-full" />
                ) : (
                  <TemplateUploader
                    slug={slug}
                    label={title}
                    fileName={fileNames[slug] ?? null}
                    onUploadComplete={() => refetchOne(slug)}
                  />
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
