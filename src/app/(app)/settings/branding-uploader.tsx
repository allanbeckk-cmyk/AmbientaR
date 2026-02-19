
'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, CloudUpload } from 'lucide-react';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import { useUploadBrandingImage } from '@/hooks/use-branding-upload';

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

  return (
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
      <div className="flex gap-2">
        <Input type="file" accept="image/*" onChange={handleFileChange} disabled={isUploading} className="flex-1" />
        <Button onClick={handleUploadClick} disabled={isUploading || !file}>
          {isUploading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Enviando...</> : <><CloudUpload className="h-4 w-4 mr-2" />Enviar</>}
        </Button>
      </div>
    </div>
  );
}
