
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon, Loader2, Upload } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import type { Invoice, Client, Contract } from '@/lib/types';
import { useFirebase, errorEmitter, useCollection, useMemoFirebase } from '@/firebase';
import { FirestorePermissionError } from '@/firebase/errors';
import { collection, doc, addDoc, updateDoc, query, where } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { DialogFooter } from '@/components/ui/dialog';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const formSchema = z.object({
  clientId: z.string().min(1, 'Selecione um cliente.'),
  invoiceNumber: z.string().min(1, 'O número da fatura é obrigatório.'),
  amount: z.coerce.number().positive('O valor deve ser positivo.'),
  status: z.enum(['Paid', 'Unpaid', 'Overdue']),
  invoiceDate: z.date({ required_error: 'A data de emissão é obrigatória.' }),
  dueDate: z.date({ required_error: 'A data de vencimento é obrigatória.' }),
  contractId: z.string().optional(),
  file: z.any()
    .optional()
    .refine(
      (files) => !files || files.length === 0 || files?.[0]?.size <= MAX_FILE_SIZE,
      `O tamanho máximo do arquivo é 5MB.`
    ),
}).refine(data => data.dueDate >= data.invoiceDate, {
    message: 'A data de vencimento não pode ser anterior à data de emissão.',
    path: ['dueDate'],
});


type FormValues = z.infer<typeof formSchema>;

interface InvoiceFormProps {
  currentItem?: Invoice | null;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const invoiceStatuses: { value: Invoice['status'], label: string }[] = [
  { value: 'Paid', label: 'Paga' },
  { value: 'Unpaid', label: 'Pendente' },
  { value: 'Overdue', label: 'Atrasada' },
];

const formatCurrencyBRL = (value: number) => {
    if (isNaN(value)) value = 0;
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
};

const CurrencyInput = React.forwardRef<HTMLInputElement, Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> & { onChange: (value: number) => void; value: number }>(
    ({ value, onChange, ...props }, ref) => {
        const [displayValue, setDisplayValue] = React.useState(formatCurrencyBRL(value || 0));

        React.useEffect(() => {
            setDisplayValue(formatCurrencyBRL(value || 0));
        }, [value]);

        const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            const rawValue = e.target.value.replace(/\D/g, '');
            const numericValue = Number(rawValue) / 100;
            onChange(numericValue);
            setDisplayValue(formatCurrencyBRL(numericValue));
        };
        
        const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
            const rawValue = e.target.value.replace(/\D/g, '');
            const numericValue = Number(rawValue) / 100;
            setDisplayValue(formatCurrencyBRL(numericValue));
        };

        return <Input ref={ref} value={displayValue} onChange={handleChange} onBlur={handleBlur} {...props} />;
    }
);
CurrencyInput.displayName = "CurrencyInput";

export function InvoiceForm({ currentItem, onSuccess, onCancel }: InvoiceFormProps) {
  const [loading, setLoading] = React.useState(false);
  const [isUploading, setIsUploading] = React.useState(false);
  const [uploadedFileUrl, setUploadedFileUrl] = React.useState<string | null>(currentItem?.fileUrl || null);

  const { toast } = useToast();
  const { firestore } = useFirebase();

  const clientsQuery = useMemoFirebase(() => firestore ? collection(firestore, 'clients') : null, [firestore]);
  const { data: clients, isLoading: isLoadingClients } = useCollection<Client>(clientsQuery);
  
  const contractsQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'contracts'), where('status', '==', 'Aprovado')) : null, [firestore]);
  const { data: contracts, isLoading: isLoadingContracts } = useCollection<Contract>(contractsQuery);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      clientId: currentItem?.clientId || '',
      invoiceNumber: currentItem?.invoiceNumber || '',
      amount: currentItem?.amount || undefined,
      status: currentItem?.status || 'Unpaid',
      invoiceDate: currentItem?.invoiceDate ? new Date(currentItem.invoiceDate) : new Date(),
      dueDate: currentItem?.dueDate ? new Date(currentItem.dueDate) : new Date(),
      contractId: currentItem?.contractId || '',
    },
  });

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadedFileUrl(null);
    
    try {
      const storage = getStorage();
      const storageRef = ref(storage, `invoices/${Date.now()}-${file.name}`);
      const uploadResult = await uploadBytes(storageRef, file);
      const downloadUrl = await getDownloadURL(uploadResult.ref);
      setUploadedFileUrl(downloadUrl);
      toast({ title: "Anexo carregado", description: "O arquivo está pronto para ser salvo com a fatura."});
    } catch (error) {
      console.error("File upload error:", error);
      toast({ variant: 'destructive', title: 'Erro no Upload', description: 'Não foi possível enviar o arquivo.' });
    } finally {
      setIsUploading(false);
    }
  };


  async function onSubmit(values: FormValues) {
    setLoading(true);

    if (!firestore) {
      toast({ variant: 'destructive', title: 'Firebase não inicializado.' });
      setLoading(false);
      return;
    }
    
    const dataToSave: Omit<Invoice, 'id'> = {
      clientId: values.clientId,
      invoiceNumber: values.invoiceNumber,
      amount: values.amount,
      status: values.status,
      invoiceDate: values.invoiceDate.toISOString(),
      dueDate: values.dueDate.toISOString(),
      fileUrl: uploadedFileUrl || currentItem?.fileUrl || '',
      contractId: values.contractId || '',
    };

    if (currentItem) {
      const docRef = doc(firestore, 'invoices', currentItem.id);
      updateDoc(docRef, dataToSave)
        .then(() => {
          toast({ title: 'Fatura atualizada!', description: 'As informações foram salvas com sucesso.' });
          onSuccess?.();
        })
        .catch(async (serverError) => {
          const permissionError = new FirestorePermissionError({ path: docRef.path, operation: 'update', requestResourceData: dataToSave });
          errorEmitter.emit('permission-error', permissionError);
        })
        .finally(() => setLoading(false));
    } else {
      const collectionRef = collection(firestore, 'invoices');
      addDoc(collectionRef, dataToSave)
        .then(() => {
          toast({ title: 'Fatura criada!', description: `A fatura ${values.invoiceNumber} foi criada.` });
          form.reset();
          onSuccess?.();
        })
        .catch(async (serverError) => {
          const permissionError = new FirestorePermissionError({ path: collectionRef.path, operation: 'create', requestResourceData: dataToSave });
          errorEmitter.emit('permission-error', permissionError);
        })
        .finally(() => setLoading(false));
    }
  }


  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="h-full flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto pr-6 pl-1 -mr-6 -ml-1 space-y-4">
          <FormField
            control={form.control}
            name="clientId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cliente</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoadingClients || !clients}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={isLoadingClients ? "Carregando..." : "Selecione um cliente"} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {clients?.map(client => (
                      <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="contractId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Contrato (Opcional)</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoadingContracts || !contracts}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={isLoadingContracts ? "Carregando..." : "Selecione um contrato"} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {contracts?.map(contract => (
                      <SelectItem key={contract.id} value={contract.id}>{contract.objeto.empreendimento} - {new Date(contract.dataContrato).toLocaleDateString('pt-BR')}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                 <FormDescription>Vincule esta fatura a um contrato aprovado.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="invoiceNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Número da Fatura</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: FAT-2024-001" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Valor (R$)</FormLabel>
                <FormControl>
                  <CurrencyInput placeholder="R$ 0,00" value={field.value} onChange={field.onChange} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                  control={form.control}
                  name="invoiceDate"
                  render={({ field }) => (
                      <FormItem className="flex flex-col">
                      <FormLabel>Data de Emissão</FormLabel>
                      <Popover>
                          <PopoverTrigger asChild>
                          <FormControl>
                              <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")}>
                              {field.value ? format(field.value, "PPP", { locale: ptBR }) : <span>Escolha uma data</span>}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                          </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                          <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                          </PopoverContent>
                      </Popover>
                      <FormMessage />
                      </FormItem>
                  )}
              />
              <FormField
                  control={form.control}
                  name="dueDate"
                  render={({ field }) => (
                      <FormItem className="flex flex-col">
                      <FormLabel>Data de Vencimento</FormLabel>
                      <Popover>
                          <PopoverTrigger asChild>
                          <FormControl>
                              <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")}>
                              {field.value ? format(field.value, "PPP", { locale: ptBR }) : <span>Escolha uma data</span>}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                          </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                          <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
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
                      <SelectValue placeholder="Selecione a fase atual" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {invoiceStatuses.map(s => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="file"
            render={({ field }) => (
                <FormItem>
                    <FormLabel>Boleto / Comprovante (Opcional)</FormLabel>
                    <FormControl>
                        <Input 
                            type="file" 
                            accept="application/pdf,image/jpeg,image/png"
                            onChange={handleFileChange}
                            disabled={isUploading}
                        />
                    </FormControl>
                    <FormDescription>
                        Anexe o boleto ou comprovante da fatura (PDF, JPG, PNG). Máx 5MB.
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
          <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
          <Button type="submit" disabled={loading || isUploading}>
            {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando...</> : 
            isUploading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Carregando anexo...</> : 
            'Salvar Fatura'}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}
