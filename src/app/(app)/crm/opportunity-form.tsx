
'use client';

import * as React from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
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
import { CalendarIcon, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import type { Opportunity, OpportunityStage, Client } from '@/lib/types';
import { useFirebase, errorEmitter, useCollection, useMemoFirebase } from '@/firebase';
import { FirestorePermissionError } from '@/firebase/errors';
import { collection, doc, addDoc, updateDoc } from 'firebase/firestore';

const formSchema = z.object({
  name: z.string().min(2, 'O nome da oportunidade é obrigatório.'),
  clientId: z.string().min(1, 'Selecione um cliente.'),
  value: z.coerce.number().positive('O valor deve ser um número positivo.'),
  stage: z.enum(['Qualificação', 'Proposta', 'Negociação', 'Fechado Ganho', 'Fechado Perdido']),
  closeDate: z.date({ required_error: 'A data de fechamento é obrigatória.' }),
});

type FormValues = z.infer<typeof formSchema>;

interface OpportunityFormProps {
  currentItem?: Opportunity | null;
  onSuccess?: () => void;
}

const pipelineStages: OpportunityStage[] = [
  'Qualificação',
  'Proposta',
  'Negociação',
  'Fechado Ganho',
  'Fechado Perdido',
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


export function OpportunityForm({ currentItem, onSuccess }: OpportunityFormProps) {
  const [loading, setLoading] = React.useState(false);
  const { toast } = useToast();
  const { firestore } = useFirebase();

  const clientsQuery = useMemoFirebase(() => firestore ? collection(firestore, 'clients') : null, [firestore]);
  const { data: clients, isLoading: isLoadingClients } = useCollection<Client>(clientsQuery);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: currentItem?.name || '',
      clientId: currentItem?.clientId || '',
      value: currentItem?.value || 0,
      stage: currentItem?.stage || 'Qualificação',
      closeDate: currentItem?.closeDate ? new Date(currentItem.closeDate) : new Date(),
    },
  });

  async function onSubmit(values: FormValues) {
    setLoading(true);

    if (!firestore) {
      toast({ variant: 'destructive', title: 'Firebase não inicializado.' });
      setLoading(false);
      return;
    }
    
    const dataToSave = {
        ...values,
        closeDate: values.closeDate.toISOString(),
    };

    if (currentItem) {
      const docRef = doc(firestore, 'opportunities', currentItem.id);
      updateDoc(docRef, dataToSave)
        .then(() => {
          toast({ title: 'Oportunidade atualizada!', description: 'As informações foram salvas com sucesso.' });
          onSuccess?.();
        })
        .catch(async (serverError) => {
          const permissionError = new FirestorePermissionError({ path: docRef.path, operation: 'update', requestResourceData: dataToSave });
          errorEmitter.emit('permission-error', permissionError);
        })
        .finally(() => setLoading(false));
    } else {
      const collectionRef = collection(firestore, 'opportunities');
      addDoc(collectionRef, dataToSave)
        .then(() => {
          toast({ title: 'Oportunidade criada!', description: `A oportunidade ${values.name} foi criada.` });
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
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome da Oportunidade</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Projeto de Licenciamento Ambiental" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
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
          name="value"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Valor (R$)</FormLabel>
              <FormControl>
                <CurrencyInput placeholder="R$ 0,00" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
         <FormField
          control={form.control}
          name="stage"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Fase do Pipeline</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a fase atual" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {pipelineStages.map(stage => (
                    <SelectItem key={stage} value={stage}>{stage}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="closeDate"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Data de Fechamento</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button variant="outline" className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
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
        <div className="flex justify-end pt-2">
          <Button type="submit" disabled={loading}>
            {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando...</> : 'Salvar Oportunidade'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
