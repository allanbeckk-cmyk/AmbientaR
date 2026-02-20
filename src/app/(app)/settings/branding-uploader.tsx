
'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, CloudUpload, Trash2 } from 'lucide-react';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import { useUploadBrandingImage } from '@/hooks/use-branding-upload';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

type BrandingField = 'headerImageUrl' | 'footerImageUrl' | 'watermarkImageUrl';

interface BrandingImageUploaderProps {
  label: string;
  fieldName: BrandingField;
  imageUrl?: string | null;
  onUploadComplete?: () => void;
}

export function BrandingImageUploader({
  label,
  fieldName,
  imageUrl,
  onUploadComplete,
}: BrandingImageUploaderProps) {
  const [file, setFile] = React.useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(imageUrl || null);
  const [isUploading, setIsUploading] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);
  const { toast } = useToast();
  const { upload } = useUploadBrandingImage();

  React.useEffect(() => {
    if (!file && imageUrl) {
      setPreviewUrl(imageUrl);
    }
  }, [imageUrl, file]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    setFile(selectedFile);
    if (selectedFile) {
      setPreviewUrl(URL.createObjectURL(selectedFile));
    } else {
      setPreviewUrl(imageUrl || null);
    }
  };

  const handleUploadClick = async () => {
    if (!file) {
      toast({
        variant: 'destructive',
        title: 'Nenhum arquivo selecionado.',
      });
      return;
    }

    setIsUploading(true);
    try {
      const result = await upload(file, fieldName);
      if (result.success) {
        toast({
          title: 'Upload concluído',
          description: 'Imagem salva. Ela será usada nos documentos e relatórios.',
        });
        setPreviewUrl(result.url ?? imageUrl ?? null);
        onUploadComplete?.();
      }
    } catch (_) {
      // Erro já tratado no hook (toast)
    } finally {
      setIsUploading(false);
      setFile(null);
    }
  };

  const handleExcluirClick = () => {
    setShowDeleteConfirm(true);
  };

  const handleConfirmExcluir = async () => {
    setIsDeleting(true);
    setShowDeleteConfirm(false);
    try {
      const res = await fetch('/api/branding', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fieldName }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ variant: 'destructive', title: 'Erro ao excluir', description: data.error ?? 'Falha ao remover imagem.' });
        return;
      }
      setPreviewUrl(null);
      setFile(null);
      onUploadComplete?.();
      toast({ title: 'Imagem removida', description: 'A identidade visual foi retirada para este item.' });
    } catch (e) {
      toast({ variant: 'destructive', title: 'Erro ao excluir', description: (e as Error).message });
    } finally {
      setIsDeleting(false);
    }
  };

  const hasImage = Boolean(previewUrl);

  return (
    <>
      <div className="space-y-2 p-4 border rounded-md">
        <Label className="font-semibold">{label}</Label>
        {previewUrl ? (
          <div className="flex justify-center p-2 border rounded-md bg-muted/50">
            <Image src={previewUrl} alt={`${label} Preview`} width={200} height={80} className="object-contain rounded-md" />
          </div>
        ) : (
          <div className="flex justify-center items-center h-24 border rounded-md bg-muted/50 text-sm text-muted-foreground">
            Sem imagem
          </div>
        )}
        <div className="flex flex-wrap gap-2 items-center">
          <Input type="file" accept="image/*" onChange={handleFileChange} disabled={isUploading || isDeleting} className="flex-1 min-w-0" />
          <Button onClick={handleUploadClick} disabled={isUploading || isDeleting || !file} variant="default">
            {isUploading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Enviando...</> : <><CloudUpload className="h-4 w-4 mr-2" />Enviar</>}
          </Button>
          <Button onClick={handleExcluirClick} disabled={isUploading || isDeleting || !hasImage} variant="outline">
            {isDeleting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Excluindo...</> : <><Trash2 className="h-4 w-4 mr-2" />Excluir</>}
          </Button>
        </div>
      </div>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir imagem?</AlertDialogTitle>
            <AlertDialogDescription>
              A imagem de &quot;{label}&quot; será removida. Documentos e relatórios deixarão de exibir este item até você enviar uma nova imagem. Deseja continuar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmExcluir} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
