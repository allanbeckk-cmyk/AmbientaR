
'use client';

import * as React from 'react';
import { z } from 'zod';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, CalendarIcon, PlusCircle, Trash2, Camera, ImagePlus, X } from 'lucide-react';
import { parse } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import type { Empreendedor, Project } from '@/lib/types';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CardFooter } from '@/components/ui/card';
import { SignaturePad } from '@/components/ui/signature-pad';
import { Badge } from '@/components/ui/badge';

const MAX_IMAGE_SIZE = 4 * 1024 * 1024; // 4MB

const inconformidadeSchema = z.object({
  description: z.string().min(10, 'A descrição deve ter pelo menos 10 caracteres.'),
  criticality: z.enum(['Baixa', 'Média', 'Alta', 'Urgente']),
  imageUrls: z.array(z.string()).optional(),
});

const inspectionSchema = z.object({
  empreendedorId: z.string().min(1, 'Selecione um empreendedor.'),
  projectId: z.string().min(1, 'Selecione um empreendimento.'),
  inspectionDate: z.date({ required_error: 'A data da vistoria é obrigatória.' }),
  inconformidades: z.array(inconformidadeSchema).min(1, "Adicione pelo menos uma inconformidade ou observação."),
  accompaniedBy: z.string().optional(),
  signatureUrl: z.string().optional(),
});

type InspectionFormValues = z.infer<typeof inspectionSchema>;

interface InspectionFormProps {
    onSuccess: () => void;
}

const criticalityConfig: Record<string, { label: string; color: string; bg: string; border: string }> = {
  'Baixa': { label: 'Baixa', color: 'text-emerald-700 dark:text-emerald-400', bg: 'bg-emerald-500/15', border: 'border-emerald-500/40' },
  'Média': { label: 'Média', color: 'text-yellow-700 dark:text-yellow-400', bg: 'bg-yellow-500/15', border: 'border-yellow-500/40' },
  'Alta': { label: 'Alta', color: 'text-orange-700 dark:text-orange-400', bg: 'bg-orange-500/15', border: 'border-orange-500/40' },
  'Urgente': { label: 'Urgente', color: 'text-red-700 dark:text-red-400', bg: 'bg-red-500/15', border: 'border-red-500/40' },
};

export function InspectionForm({ onSuccess }: InspectionFormProps) {
  const [loading, setLoading] = React.useState(false);
  const [uploadingIndex, setUploadingIndex] = React.useState<number | null>(null);

  const { toast } = useToast();
  const { firestore, user } = useFirebase();
  const cameraInputRefs = React.useRef<Map<number, HTMLInputElement>>(new Map());
  const fileInputRefs = React.useRef<Map<number, HTMLInputElement>>(new Map());

  const empreendedoresQuery = useMemoFirebase(() => firestore ? collection(firestore, 'empreendedores') : null, [firestore]);
  const { data: empreendedores, isLoading: isLoadingEmpreendedores } = useCollection<Empreendedor>(empreendedoresQuery);

  const projectsQuery = useMemoFirebase(() => firestore ? collection(firestore, 'projects') : null, [firestore]);
  const { data: allProjects, isLoading: isLoadingProjects } = useCollection<Project>(projectsQuery);

  const form = useForm<InspectionFormValues>({
    resolver: zodResolver(inspectionSchema),
    defaultValues: {
      empreendedorId: '',
      projectId: '',
      inspectionDate: new Date(),
      inconformidades: [],
      accompaniedBy: '',
      signatureUrl: '',
    },
  });
  
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'inconformidades'
  });

  const selectedEmpreendedorId = form.watch('empreendedorId');

  const filteredProjects = React.useMemo(() => {
    if (!allProjects || !selectedEmpreendedorId) return [];
    return allProjects.filter(p => p.empreendedorId === selectedEmpreendedorId);
  }, [allProjects, selectedEmpreendedorId]);
  
  React.useEffect(() => {
    form.resetField('projectId');
  }, [selectedEmpreendedorId, form]);

  const handleImageUpload = async (file: File, index: number) => {
    if (file.size > MAX_IMAGE_SIZE) {
      toast({ variant: 'destructive', title: 'Arquivo muito grande', description: 'O tamanho máximo é 4MB.' });
      return;
    }

    setUploadingIndex(index);
    try {
      const storage = getStorage();
      const storageRef = ref(storage, `inspections/${Date.now()}-${file.name}`);
      const uploadResult = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(uploadResult.ref);

      const currentImages = form.getValues(`inconformidades.${index}.imageUrls`) || [];
      form.setValue(`inconformidades.${index}.imageUrls`, [...currentImages, downloadURL]);
      toast({ title: 'Foto adicionada!' });
    } catch (error) {
      console.error('Upload error:', error);
      toast({ variant: 'destructive', title: 'Erro no upload', description: 'Não foi possível enviar a imagem.' });
    } finally {
      setUploadingIndex(null);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = e.target.files?.[0];
    if (file) handleImageUpload(file, index);
    e.target.value = '';
  };

  const removeImage = (fieldIndex: number, imageIndex: number) => {
    const currentImages = form.getValues(`inconformidades.${fieldIndex}.imageUrls`) || [];
    form.setValue(`inconformidades.${fieldIndex}.imageUrls`, currentImages.filter((_, i) => i !== imageIndex));
  };

  async function onSubmit(values: InspectionFormValues) {
    if (!firestore || !user) {
      toast({ variant: 'destructive', title: 'Erro de Autenticação' });
      return;
    }
    setLoading(true);
    
    const dataToSave = {
        ...values,
        inspectionDate: values.inspectionDate.toISOString(),
        inspectorId: user.uid,
        inspectorName: user.name || user.email,
        createdAt: serverTimestamp(),
        status: 'Em Aberto',
    };

    try {
      await addDoc(collection(firestore, 'inspections'), dataToSave);
      toast({ title: 'Vistoria Registrada!', description: 'O registro da vistoria foi salvo com sucesso.' });
      form.reset();
      onSuccess();
    } catch (error) {
      console.error('Error creating inspection:', error);
      toast({ variant: 'destructive', title: 'Erro ao Salvar', description: 'Não foi possível registrar a vistoria.' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <FormField
            control={form.control}
            name="empreendedorId"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Empreendedor</FormLabel>
                <Select onValueChange={field.onChange} value={field.value} disabled={isLoadingEmpreendedores}>
                    <FormControl>
                    <SelectTrigger className="h-12 text-base">
                        <SelectValue placeholder={isLoadingEmpreendedores ? 'Carregando...' : 'Selecione o empreendedor'} />
                    </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                    {empreendedores?.map(e => (
                        <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                    ))}
                    </SelectContent>
                </Select>
                <FormMessage />
                </FormItem>
            )}
            />
            <FormField
            control={form.control}
            name="projectId"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Empreendimento</FormLabel>
                <Select onValueChange={field.onChange} value={field.value} disabled={!selectedEmpreendedorId || isLoadingProjects}>
                    <FormControl>
                    <SelectTrigger className="h-12 text-base">
                        <SelectValue placeholder={!selectedEmpreendedorId ? 'Selecione um empreendedor primeiro' : 'Selecione o empreendimento'} />
                    </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                    {filteredProjects.map(p => (
                        <SelectItem key={p.id} value={p.id}>{p.propertyName}</SelectItem>
                    ))}
                    </SelectContent>
                </Select>
                <FormMessage />
                </FormItem>
            )}
            />
            <FormField
            control={form.control}
            name="inspectionDate"
            render={({ field }) => {
                const [dateInputValue, setDateInputValue] = React.useState(
                    field.value ? format(field.value, 'dd/MM/yyyy') : format(new Date(), 'dd/MM/yyyy')
                );

                React.useEffect(() => {
                    if (field.value && field.value instanceof Date && !isNaN(field.value.getTime())) {
                        setDateInputValue(format(field.value, 'dd/MM/yyyy'));
                    }
                }, [field.value]);

                React.useEffect(() => {
                    if (!field.value) {
                        const today = new Date();
                        field.onChange(today);
                        setDateInputValue(format(today, 'dd/MM/yyyy'));
                    }
                }, []);

                const handleDateInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
                    let value = e.target.value.replace(/\D/g, '');
                    if (value.length > 2) value = `${value.slice(0, 2)}/${value.slice(2)}`;
                    if (value.length > 5) value = `${value.slice(0, 5)}/${value.slice(5)}`;
                    if (value.length > 10) value = value.slice(0, 10);
                    setDateInputValue(value);

                    if (value.length === 10) {
                        const parsedDate = parse(value, 'dd/MM/yyyy', new Date());
                        if (!isNaN(parsedDate.getTime()) && parsedDate <= new Date()) {
                            field.onChange(parsedDate);
                        }
                    }
                };

                return (
                    <FormItem className="flex flex-col">
                    <FormLabel>Data da Vistoria</FormLabel>
                    <Popover>
                        <PopoverTrigger asChild>
                        <div className="relative">
                            <FormControl>
                                <Input
                                    placeholder="DD/MM/AAAA"
                                    value={dateInputValue}
                                    onChange={handleDateInputChange}
                                    className="h-12 text-base pr-10"
                                    inputMode="numeric"
                                />
                            </FormControl>
                            <CalendarIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 opacity-50" />
                        </div>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={(date) => { if (date) field.onChange(date); }}
                                disabled={(date) => date > new Date()}
                                initialFocus
                            />
                        </PopoverContent>
                    </Popover>
                    <FormMessage />
                    </FormItem>
                );
            }}
            />

            <div className="space-y-4 rounded-lg border p-4">
                <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold">Inconformidades</h3>
                    <Button type="button" size="sm" onClick={() => append({ description: '', criticality: 'Baixa', imageUrls: [] })}>
                        <PlusCircle className="h-4 w-4 mr-2" />
                        Adicionar
                    </Button>
                </div>
                {fields.length === 0 && (
                    <div className="text-center py-8 border-2 border-dashed rounded-lg">
                        <Camera className="h-10 w-10 mx-auto text-muted-foreground/50 mb-2" />
                        <p className="text-sm text-muted-foreground">Nenhuma inconformidade adicionada.</p>
                        <p className="text-xs text-muted-foreground mt-1">Toque em "Adicionar" para registrar uma observação.</p>
                    </div>
                )}
                <div className="space-y-4">
                    {fields.map((field, index) => {
                        const currentCriticality = form.watch(`inconformidades.${index}.criticality`);
                        const config = criticalityConfig[currentCriticality] || criticalityConfig['Baixa'];
                        const currentImages = form.watch(`inconformidades.${index}.imageUrls`) || [];

                        return (
                            <div key={field.id} className={cn("p-4 rounded-lg border-2 relative space-y-4 transition-colors", config.border, config.bg)}>
                                <div className="flex items-center justify-between">
                                    <Badge variant="outline" className={cn("text-xs font-semibold", config.color, config.border, config.bg)}>
                                        Inconformidade #{index + 1}
                                    </Badge>
                                    <Button type="button" variant="destructive" size="icon" className="h-7 w-7" onClick={() => remove(index)}>
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                </div>
                                <FormField
                                    control={form.control}
                                    name={`inconformidades.${index}.description`}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Descrição</FormLabel>
                                            <FormControl>
                                                <Textarea
                                                    placeholder="Descreva a não conformidade, ponto de atenção ou observação geral."
                                                    className="min-h-[100px] text-base bg-background"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name={`inconformidades.${index}.criticality`}
                                    render={({ field: critField }) => (
                                        <FormItem>
                                            <FormLabel>Criticidade</FormLabel>
                                            <div className="grid grid-cols-4 gap-2">
                                                {Object.entries(criticalityConfig).map(([value, cfg]) => (
                                                    <Button
                                                        key={value}
                                                        type="button"
                                                        variant="outline"
                                                        className={cn(
                                                            "h-11 text-sm font-medium transition-all",
                                                            critField.value === value
                                                                ? cn(cfg.bg, cfg.border, cfg.color, "border-2 shadow-sm")
                                                                : "bg-background hover:bg-muted"
                                                        )}
                                                        onClick={() => critField.onChange(value)}
                                                    >
                                                        {cfg.label}
                                                    </Button>
                                                ))}
                                            </div>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <div className="space-y-3">
                                    <FormLabel>Registro Fotográfico</FormLabel>
                                    <div className="flex gap-2">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            capture="environment"
                                            className="hidden"
                                            ref={(el) => { if (el) cameraInputRefs.current.set(index, el); }}
                                            onChange={(e) => handleFileSelect(e, index)}
                                        />
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            ref={(el) => { if (el) fileInputRefs.current.set(index, el); }}
                                            onChange={(e) => handleFileSelect(e, index)}
                                        />
                                        <Button
                                            type="button"
                                            variant="outline"
                                            className="flex-1 h-12 gap-2 bg-background"
                                            disabled={uploadingIndex === index}
                                            onClick={() => cameraInputRefs.current.get(index)?.click()}
                                        >
                                            {uploadingIndex === index ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-5 w-5" />}
                                            Tirar Foto
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            className="flex-1 h-12 gap-2 bg-background"
                                            disabled={uploadingIndex === index}
                                            onClick={() => fileInputRefs.current.get(index)?.click()}
                                        >
                                            {uploadingIndex === index ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-5 w-5" />}
                                            Galeria
                                        </Button>
                                    </div>

                                    {currentImages.length > 0 && (
                                        <div className="grid grid-cols-3 gap-2">
                                            {currentImages.map((url, imgIndex) => (
                                                <div key={imgIndex} className="relative group aspect-square rounded-lg overflow-hidden border bg-background">
                                                    <img src={url} alt={`Foto ${imgIndex + 1}`} className="w-full h-full object-cover" />
                                                    <Button
                                                        type="button"
                                                        variant="destructive"
                                                        size="icon"
                                                        className="absolute top-1 right-1 h-6 w-6 opacity-80 hover:opacity-100"
                                                        onClick={() => removeImage(index, imgIndex)}
                                                    >
                                                        <X className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    <p className="text-xs text-muted-foreground">Máximo 4MB por imagem. Use a câmera para registrar no local.</p>
                                </div>
                            </div>
                        )
                    })}
                </div>
                 <FormMessage>{form.formState.errors.inconformidades?.message}</FormMessage>
            </div>
            
             <div className="space-y-4 rounded-lg border p-4">
                <h3 className="text-lg font-semibold">Finalização</h3>
                 <FormField
                    control={form.control}
                    name="accompaniedBy"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Nome de quem acompanhou a vistoria</FormLabel>
                        <FormControl>
                            <Input placeholder="Nome completo" className="h-12 text-base" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="signatureUrl"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Assinatura Digital (Opcional)</FormLabel>
                            <FormControl>
                                <SignaturePad onSignatureEnd={(dataUrl) => field.onChange(dataUrl)} />
                            </FormControl>
                            <FormDescription>
                                Peça para a pessoa que acompanhou assinar no quadro acima.
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
            
            <CardFooter className="p-0 pt-4">
                <Button type="submit" disabled={loading} className="w-full h-14 text-base font-semibold">
                {loading ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Salvando Vistoria...</> : 
                'Salvar Registro de Vistoria'}
                </Button>
            </CardFooter>
        </form>
    </Form>
  );
}
