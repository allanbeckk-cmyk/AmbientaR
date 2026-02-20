'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, CloudUpload, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface TemplateUploaderProps {
  slug: string;
  label: string;
  fileName?: string | null;
  onUploadComplete?: () => void;
}

export function TemplateUploader({ slug, label, fileName, onUploadComplete }: TemplateUploaderProps) {
  const [file, setFile] = React.useState<File | null>(null);
  const [isUploading, setIsUploading] = React.useState(false);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFile(e.target.files?.[0] ?? null);
  };

  const handleUploadClick = async () => {
    if (!file) {
      toast({ variant: 'destructive', title: 'Nenhum arquivo selecionado.' });
      return;
    }
    const ext = (file.name.slice(file.name.lastIndexOf('.')) || '').toLowerCase();
    if (ext !== '.docx' && ext !== '.doc') {
      toast({ variant: 'destructive', title: 'Apenas arquivos .docx ou .doc são aceitos.' });
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.set('file', file);
      const res = await fetch(`/api/templates/${slug}`, { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) {
        toast({ variant: 'destructive', title: 'Erro ao enviar', description: data.error ?? 'Falha no upload.' });
        return;
      }
      toast({ title: 'Upload concluído', description: `Template ${label} salvo.` });
      setFile(null);
      onUploadComplete?.();
    } catch {
      toast({ variant: 'destructive', title: 'Erro ao enviar template.' });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-2 p-4 border rounded-md">
      <Label className="font-semibold">Template {label} (DOCX)</Label>
      {fileName ? (
        <div className="flex items-center gap-2 p-2 border rounded-md bg-muted/50 text-sm">
          <FileText className="w-4 h-4 shrink-0" />
          <span>{fileName}</span>
        </div>
      ) : (
        <div className="flex justify-center items-center h-24 border rounded-md bg-muted/50 text-sm text-muted-foreground">
          Sem arquivo
        </div>
      )}
      <div className="flex gap-2">
        <Input
          type="file"
          accept=".docx,.doc"
          onChange={handleFileChange}
          disabled={isUploading}
          className="flex-1"
        />
        <Button onClick={handleUploadClick} disabled={isUploading || !file}>
          {isUploading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Enviando...
            </>
          ) : (
            <>
              <CloudUpload className="h-4 w-4 mr-2" />
              Enviar
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
