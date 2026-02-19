
'use client';

import * as React from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
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
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { getStorage, ref, uploadBytes, getDownloadURL, type UploadResult } from 'firebase/storage';

import { useToast } from '@/hooks/use-toast';
import type { EnvironmentalIntervention, PermitStatus, Empreendedor } from '@/lib/types';
import { useFirebase, errorEmitter, useCollection, useMemoFirebase } from '@/firebase';
import { FirestorePermissionError } from '@/firebase/errors';
import { collection, doc, addDoc, updateDoc } from 'firebase/firestore';
import { DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const formSchema = z.object({
  empreendedorId: z.string().min(1, 'Selecione um empreendedor.'),
  processNumber: z.string().min(1, 'O número do processo é obrigatório.'),
  issuingBody: z.string().min(1, 'O órgão emissor é obrigatório.'),
  issueDate: z.date({ required_error: 'A data de emissão é obrigatória.' }),
  expirationDate: z.date({ required_error: 'A data de vencimento é obrigatória.' }),
  status: z.enum(['Válida', 'Vencida', 'Em Renovação', 'Suspensa', 'Cancelada'], { required_error: 'Selecione o status.'}),
  description: z.string().min(1, 'A descrição do tipo é obrigatória.'),
  file: z.any()
    .optional()
    .refine(
      (files) => !files || files.length === 0 || files?.[0]?.size <= MAX_FILE_SIZE,
      `O tamanho máximo do arquivo é ${MAX_FILE_SIZE / 1024 / 1024}MB.`
    ),
}).refine(data => data.expirationDate > data.issueDate, {
  message: 'A data de vencimento deve ser posterior à data de emissão.',
  path: ['expirationDate'],
});


type FormValues = z.infer<typeof formSchema>;

interface IntervencaoFormProps {
  currentItem?: EnvironmentalIntervention | null;
  onSuccess?: () => void;
}

const permitStatuses: { value: PermitStatus, label: string }[] = [
    { value: 'Válida', label: 'Válida' },
    { value: 'Vencida', label: 'Vencida' },
    { value: 'Em Renovação', label: 'Em Renovação' },
    { value: 'Suspensa', label: 'Suspensa' },
    { value: 'Cancelada', label: 'Cancelada' },
];

export function IntervencaoForm({ currentItem, onSuccess }: IntervencaoFormProps) {
  const [loading, setLoading] = React.useState(false);
  const [isUploading, setIsUploading] = React.useState(false);
  const [uploadedFileUrl, setUploadedFileUrl] = React.useState<string | null>(currentItem?.fileUrl || null);

  const { toast } = useToast();
  const { firestore } = useFirebase();

  const empreendedoresQuery = useMemoFirebase(() => (firestore ? collection(firestore, 'empreendedores') : null), [firestore]);
  const { data: empreendedores, isLoading: isLoadingEmpreendedores } = useCollection<Empreendedor>(empreendedoresQuery);


  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      empreendedorId: currentItem?.empreendedorId || '',
      processNumber: currentItem?.processNumber || '',
      issuingBody: currentItem?.issuingBody || '',
      issueDate: currentItem ? new Date(currentItem.issueDate) : undefined,
      expirationDate: currentItem ? new Date(currentItem.expirationDate) : undefined,
      status: currentItem?.status || undefined,
      description: currentItem?.description || '',
    },
  });

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

     if (file.size > MAX_FILE_SIZE) {
        toast({ variant: 'destructive', title: 'Arquivo muito grande', description: `O arquivo não pode exceder ${MAX_FILE_SIZE / 1024 / 1024}MB.` });
        return;
    }

    setIsUploading(true);
    setUploadedFileUrl(null);
    try {
        const storage = getStorage();
        const storageRef = ref(storage, `intervencoes/${Date.now()}-${file.name}`);
        const uploadResult: UploadResult = await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(uploadResult.ref);
        setUploadedFileUrl(downloadURL);
        toast({ title: "Anexo carregado", description: "O arquivo está pronto para ser salvo." });
    } catch (error) {
        console.error("File upload error:", error);
        toast({ variant: 'destructive', title: 'Erro no Upload', description: 'Não foi possível enviar o arquivo.' });
    } finally {
        setIsUploading(false);
    }
  }


  async function onSubmit(values: FormValues) {
    setLoading(true);

    if (!firestore) {
      toast({ variant: 'destructive', title: 'Firebase não inicializado.' });
      setLoading(false);
      return;
    }
        
    const dataToSave = {
        ...values,
        issueDate: values.issueDate.toISOString(),
        expirationDate: values.expirationDate.toISOString(),
        fileUrl: uploadedFileUrl || currentItem?.fileUrl || '',
    };


    if (currentItem) {
      const docRef = doc(firestore, 'intervencoes', currentItem.id);
      updateDoc(docRef, dataToSave)
        .then(() => {
          toast({
            title: 'Intervenção atualizada!',
            description: 'As informações da intervenção foram salvas com sucesso.',
          });
          onSuccess?.();
        })
        .catch(async (serverError) => {
          const permissionError = new FirestorePermissionError({
            path: docRef.path,
            operation: 'update',
            requestResourceData: dataToSave,
          });
          errorEmitter.emit('permission-error', permissionError);
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      const collectionRef = collection(firestore, 'intervencoes');
      addDoc(collectionRef, dataToSave)
        .then(() => {
          toast({
            title: 'Intervenção criada!',
            description: `A intervenção no processo ${values.processNumber} foi adicionada com sucesso.`,
          });
          form.reset();
          onSuccess?.();
        })
        .catch(async (serverError) => {
          const permissionError = new FirestorePermissionError({
            path: collectionRef.path,
            operation: 'create',
            requestResourceData: dataToSave,
          });
          errorEmitter.emit('permission-error', permissionError);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>{currentItem ? 'Editar Intervenção' : 'Adicionar Nova Intervenção'}</DialogTitle>
        <DialogDescription>
          {currentItem
            ? 'Atualize os detalhes da intervenção abaixo.'
            : 'Preencha os detalhes para criar uma nova intervenção.'}
        </DialogDescription>
      </DialogHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="h-full flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto pr-6 pl-1 -mr-6 -ml-1 space-y-4">
          <FormField
            control={form.control}
            name="empreendedorId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Empreendedor</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoadingEmpreendedores}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={isLoadingEmpreendedores ? "Carregando..." : "Selecione um empreendedor"} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {empreendedores?.map(emp => (
                      <SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="processNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Número do Processo</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: 12345/2022" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="issuingBody"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Órgão Emissor</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: IEF, SEMAD" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
              control={form.control}
              name="issueDate"
              render={({ field }) => (
                  <FormItem className="flex flex-col">
                  <FormLabel>Data de Emissão</FormLabel>
                  <Popover>
                      <PopoverTrigger asChild>
                      <FormControl>
                          <Button
                          variant={"outline"}
                          className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                          >
                          {field.value ? (
                              format(field.value, "PPP", { locale: ptBR })
                          ) : (
                              <span>Escolha uma data</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                      </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                          initialFocus
                      />
                      </PopoverContent>
                  </Popover>
                  <FormMessage />
                  </FormItem>
              )}
              />
              <FormField
              control={form.control}
              name="expirationDate"
              render={({ field }) => (
                  <FormItem className="flex flex-col">
                  <FormLabel>Data de Vencimento</FormLabel>
                  <Popover>
                      <PopoverTrigger asChild>
                      <FormControl>
                          <Button
                          variant={"outline"}
                          className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                          >
                          {field.value ? (
                              format(field.value, "PPP", { locale: ptBR })
                          ) : (
                              <span>Escolha uma data</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                      </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                      />
                      </PopoverContent>
                  </Popover>
                  <FormMessage />
                  </FormItem>
              )}
              />
          </div>
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o status atual" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {permitStatuses.map(status => (
                      <SelectItem key={status.value} value={status.value}>{status.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo de Intervenção</FormLabel>
                <FormControl>
                  <Textarea placeholder="Descreva o tipo de intervenção (e.g., Supressão de Vegetação Nativa, Corte de Árvores Isoladas...)" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="file"
            render={({ field }) => (
                <FormItem>
                    <FormLabel>Anexar Documento</FormLabel>
                    <FormControl>
                        <Input 
                            type="file" 
                            accept="application/pdf,image/jpeg,image/png"
                            onChange={handleFileChange}
                            disabled={isUploading}
                        />
                    </FormControl>
                    <FormDescription>
                        Anexe a autorização ou documento relacionado (PDF, JPG, PNG). Máx 10MB.
                        {currentItem?.fileUrl && !uploadedFileUrl && (
                        <span className="block mt-2 text-xs">
                            Arquivo atual: <a href={currentItem.fileUrl} target="_blank" className="underline" rel="noreferrer">ver anexo</a>
                        </span>
                        )}
                        {uploadedFileUrl && (
                            <span className="block mt-2 text-xs text-green-600">
                            Novo arquivo carregado: <a href={uploadedFileUrl} target="_blank" className="underline" rel="noreferrer">ver anexo</a>
                            </span>
                        )}
                    </FormDescription>
                    <FormMessage />
                </FormItem>
            )}
          />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onSuccess}>Cancelar</Button>
            <Button type="submit" disabled={loading || isUploading}>
              {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando...</> : 
              isUploading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Carregando...</> : 
              'Salvar Intervenção'}
            </Button>
          </DialogFooter>
        </form>
      </Form>
    </>
  );
}
