
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { cn, numberToWordsBRL } from '@/lib/utils';
import { format, parse } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import type { Revenue, Expense, Client } from '@/lib/types';
import { useFirebase, errorEmitter, useCollection, useMemoFirebase } from '@/firebase';
import { FirestorePermissionError } from '@/firebase/errors';
import { collection, doc, addDoc, updateDoc } from 'firebase/firestore';
import { logUserAction } from '@/lib/audit-log';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const formSchema = z.object({
  description: z.string().min(2, 'A descrição é obrigatória.'),
  amount: z.coerce.number().positive('O valor deve ser positivo.'),
  amountInWords: z.string().optional(),
  date: z.date({ required_error: 'A data é obrigatória.' }),
  clientId: z.string().optional(),
  file: z.any()
    .optional()
    .refine(
      (files) => !files || files.length === 0 || files?.[0]?.size <= MAX_FILE_SIZE,
      `O tamanho máximo do arquivo é 5MB.`
    ),
});

type TransactionFormValues = z.infer<typeof formSchema>;

interface TransactionFormProps {
  transactionType: 'revenue' | 'expense';
  currentItem?: Revenue | Expense | null;
  onSuccess?: () => void;
  onCancel?: () => void;
}

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


export function TransactionForm({ transactionType, currentItem, onSuccess, onCancel }: TransactionFormProps) {
  const [loading, setLoading] = React.useState(false);
  const [isUploading, setIsUploading] = React.useState(false);
  const [uploadedFileUrl, setUploadedFileUrl] = React.useState<string | null>(currentItem?.fileUrl || null);
  const [dateInput, setDateInput] = React.useState<string>(
    currentItem?.date ? format(new Date(currentItem.date), 'dd/MM/yyyy') : format(new Date(), 'dd/MM/yyyy')
  );
  const { toast } = useToast();
  const { firestore, auth } = useFirebase();
  
  const clientsQuery = useMemoFirebase(() => firestore ? collection(firestore, 'clients') : null, [firestore]);
  const { data: clients, isLoading: isLoadingClients } = useCollection<Client>(clientsQuery);

  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: currentItem?.description || '',
      amount: currentItem?.amount || 0,
      amountInWords: currentItem?.amount ? numberToWordsBRL(currentItem.amount) : '',
      date: currentItem ? new Date(currentItem.date) : new Date(),
      clientId: (currentItem as Revenue)?.clientId || '',
    },
  });

  const amountValue = form.watch('amount');
  
  React.useEffect(() => {
      form.setValue('amountInWords', numberToWordsBRL(amountValue));
  }, [amountValue, form]);
  
  const handleDateInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 2) value = `${value.slice(0, 2)}/${value.slice(2)}`;
    if (value.length > 5) value = `${value.slice(0, 5)}/${value.slice(5)}`;
    if (value.length > 10) value = value.slice(0, 10);
    setDateInput(value);

    if (value.length === 10) {
      try {
        const parsedDate = parse(value, 'dd/MM/yyyy', new Date());
        if (!isNaN(parsedDate.getTime())) {
          form.setValue('date', parsedDate, { shouldValidate: true });
        } else {
          form.setError('date', { type: 'manual', message: 'Data inválida.' });
        }
      } catch {
         form.setError('date', { type: 'manual', message: 'Formato de data inválido.' });
      }
    }
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      form.setValue('date', date, { shouldValidate: true });
      setDateInput(format(date, 'dd/MM/yyyy'));
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadedFileUrl(null);
    const collectionName = transactionType === 'revenue' ? 'revenues' : 'expenses';
    
    try {
      const storage = getStorage();
      const storageRef = ref(storage, `${collectionName}/${Date.now()}-${file.name}`);
      const uploadResult = await uploadBytes(storageRef, file);
      const downloadUrl = await getDownloadURL(uploadResult.ref);
      setUploadedFileUrl(downloadUrl);
      toast({ title: "Anexo carregado", description: "O arquivo está pronto para ser salvo."});
    } catch (error) {
      console.error("File upload error:", error);
      toast({ variant: 'destructive', title: 'Erro no Upload', description: 'Não foi possível enviar o arquivo.' });
    } finally {
      setIsUploading(false);
    }
  };


  async function onSubmit(values: TransactionFormValues) {
    setLoading(true);

    if (!firestore || !auth) {
      toast({ variant: 'destructive', title: 'Firebase não inicializado.' });
      setLoading(false);
      return;
    }
    
    const collectionName = transactionType === 'revenue' ? 'revenues' : 'expenses';
    const dataToSave = {
      description: values.description,
      amount: values.amount,
      date: values.date.toISOString(),
      fileUrl: uploadedFileUrl || currentItem?.fileUrl || '',
      ...(transactionType === 'revenue' && { clientId: values.clientId }),
    };

    if (currentItem) {
      const itemRef = doc(firestore, collectionName, currentItem.id);
      updateDoc(itemRef, dataToSave)
        .then(() => {
          toast({
            title: `Lançamento atualizado!`,
            description: 'As informações foram salvas com sucesso.',
          });
          logUserAction(firestore, auth, `update_${transactionType}`, { id: currentItem.id, description: values.description });
          onSuccess?.();
        })
        .catch(async (serverError) => {
          const permissionError = new FirestorePermissionError({
            path: itemRef.path,
            operation: 'update',
            requestResourceData: dataToSave,
          });
          errorEmitter.emit('permission-error', permissionError);
        })
        .finally(() => setLoading(false));
    } else {
      const itemsCollectionRef = collection(firestore, collectionName);
      addDoc(itemsCollectionRef, dataToSave)
        .then((docRef) => {
          toast({
            title: `Lançamento criado!`,
            description: `O lançamento foi adicionado com sucesso.`,
          });
          logUserAction(firestore, auth, `create_${transactionType}`, { id: docRef.id, description: values.description });
          form.reset();
          onSuccess?.();
        })
        .catch(async (serverError) => {
          const permissionError = new FirestorePermissionError({
            path: itemsCollectionRef.path,
            operation: 'create',
            requestResourceData: dataToSave,
          });
          errorEmitter.emit('permission-error', permissionError);
        })
        .finally(() => setLoading(false));
    }
  }

  const title = transactionType === 'revenue' ? 'Receita' : 'Despesa';

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="space-y-4">
           {transactionType === 'revenue' && (
              <FormField
                control={form.control}
                name="clientId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cliente (Opcional)</FormLabel>
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
                    <FormDescription>Vincule esta receita a um cliente.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Descrição da {title}</FormLabel>
                <FormControl>
                  <Input placeholder={`Ex: Venda de serviço de consultoria`} {...field} />
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
                  <CurrencyInput value={field.value} onChange={field.onChange} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="amountInWords"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Valor por Extenso</FormLabel>
                <FormControl>
                  <Input readOnly disabled {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Data da {title}</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <div className="relative">
                        <FormControl>
                            <Input 
                                placeholder="DD/MM/AAAA"
                                value={dateInput}
                                onChange={handleDateInputChange}
                            />
                        </FormControl>
                        <CalendarIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 opacity-50" />
                    </div>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={handleDateSelect}
                      disabled={(date) => date > new Date() || date < new Date("2000-01-01")}
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
            name="file"
            render={({ field }) => (
                <FormItem>
                    <FormLabel>Anexar Comprovante (Opcional)</FormLabel>
                    <FormControl>
                        <Input 
                            type="file" 
                            accept="application/pdf,image/jpeg,image/png"
                            onChange={handleFileChange}
                            disabled={isUploading}
                        />
                    </FormControl>
                    <FormDescription>
                        Anexe o comprovante (PDF, JPG, PNG). Máx 5MB.
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
        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>Cancelar</Button>
          <Button type="submit" disabled={loading || isUploading}>
            {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando...</> : 
            isUploading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Carregando...</> :
            'Salvar'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
