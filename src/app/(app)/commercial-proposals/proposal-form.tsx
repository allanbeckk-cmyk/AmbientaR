
'use client';

import * as React from 'react';
import { z } from 'zod';
import { useForm, useFieldArray, useWatch } from 'react-hook-form';
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
import { CalendarIcon, Loader2, PlusCircle, Trash2, List } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, parse } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import type { CommercialProposal, Client, CommercialProposalItem, Service } from '@/lib/types';
import { useFirebase, errorEmitter, useCollection, useMemoFirebase } from '@/firebase';
import { FirestorePermissionError } from '@/firebase/errors';
import { collection, doc, addDoc, updateDoc } from 'firebase/firestore';
import { Textarea } from '@/components/ui/textarea';
import { logUserAction } from '@/lib/audit-log';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogContent } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';


const formSchema = z.object({
  clientId: z.string().min(1, 'Selecione um cliente.'),
  empreendimento: z.string().optional(),
  proposalNumber: z.string().min(1, 'O número da proposta é obrigatório.'),
  items: z.array(z.object({
    description: z.string().min(1, 'A descrição do serviço é obrigatória.'),
    value: z.coerce.number().min(0, 'O valor não pode ser negativo.'),
  })).min(1, 'Adicione pelo menos um item de serviço.'),
  paymentTerms: z.string().optional(),
  amount: z.number(),
  status: z.enum(['Draft', 'Sent', 'Accepted', 'Rejected']),
  proposalDate: z.date({ required_error: 'A data de emissão é obrigatória.' }),
  validUntilDate: z.date({ required_error: 'A data de validade é obrigatória.' }),
}).refine(data => data.validUntilDate >= data.proposalDate, {
    message: 'A data de validade não pode ser anterior à data de emissão.',
    path: ['validUntilDate'],
});


type FormValues = z.infer<typeof formSchema>;

interface ProposalFormProps {
  currentItem?: CommercialProposal | null;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const proposalStatuses: { value: CommercialProposal['status'], label: string }[] = [
  { value: 'Draft', label: 'Rascunho' },
  { value: 'Sent', label: 'Enviado' },
  { value: 'Accepted', label: 'Aceito' },
  { value: 'Rejected', label: 'Rejeitado' },
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


export function ProposalForm({ currentItem, onSuccess, onCancel }: ProposalFormProps) {
  const [loading, setLoading] = React.useState(false);
  const [fileUrl, setFileUrl] = React.useState<string | null>(currentItem?.fileUrl || null);
  const [isServiceModalOpen, setIsServiceModalOpen] = React.useState(false);

  const { toast } = useToast();
  const { firestore, auth } = useFirebase();

  const clientsQuery = useMemoFirebase(() => firestore ? collection(firestore, 'clients') : null, [firestore]);
  const { data: clients, isLoading: isLoadingClients } = useCollection<Client>(clientsQuery);
  
  const servicesQuery = useMemoFirebase(() => firestore ? collection(firestore, 'services') : null, [firestore]);
  const { data: services, isLoading: isLoadingServices } = useCollection<Service>(servicesQuery);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: currentItem ? {
      ...currentItem,
      proposalDate: new Date(currentItem.proposalDate),
      validUntilDate: new Date(currentItem.validUntilDate),
      items: currentItem.items || [{ description: '', value: 0 }],
    } : {
      clientId: '',
      empreendimento: '',
      proposalNumber: '',
      items: [{ description: '', value: 0 }],
      paymentTerms: '50% de entrada e 50% na entrega do relatório final.',
      amount: 0,
      status: 'Draft',
      proposalDate: new Date(),
      validUntilDate: new Date(new Date().setDate(new Date().getDate() + 30)),
    },
  });

  React.useEffect(() => {
    if (currentItem) {
      form.reset({
        ...currentItem,
        proposalDate: new Date(currentItem.proposalDate),
        validUntilDate: new Date(currentItem.validUntilDate),
        items: currentItem.items || [{ description: '', value: 0 }],
      });
      setFileUrl(currentItem.fileUrl || null);
    }
  }, [currentItem, form]);

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items"
  });

  const watchedItems = useWatch({
    control: form.control,
    name: 'items'
  });

  const totalAmount = React.useMemo(() => {
    return watchedItems?.reduce((acc, item) => acc + (Number(item.value) || 0), 0) || 0;
  }, [watchedItems]);

  React.useEffect(() => {
    form.setValue('amount', totalAmount);
  }, [totalAmount, form]);

  const handleAddServiceFromTable = (service: Service) => {
    append({
        description: service.name + (service.description ? `\n${service.description}` : ''),
        value: service.price
    });
    setIsServiceModalOpen(false);
    toast({ title: "Serviço Adicionado!", description: `"${service.name}" foi adicionado à proposta.`});
  }
  
  async function onSubmit(values: FormValues) {
    setLoading(true);

    if (!firestore || !auth) {
      toast({ variant: 'destructive', title: 'Firebase não inicializado.' });
      setLoading(false);
      return;
    }
    
    const dataToSave = {
      ...values,
      proposalDate: values.proposalDate.toISOString(),
      validUntilDate: values.validUntilDate.toISOString(),
      fileUrl: fileUrl || '',
    };

    if (currentItem) {
      const docRef = doc(firestore, 'commercialProposals', currentItem.id);
      updateDoc(docRef, dataToSave)
        .then(() => {
          toast({ title: 'Proposta atualizada!', description: 'As informações foram salvas com sucesso.' });
          logUserAction(firestore, auth, 'update_proposal', { proposalId: currentItem.id, proposalNumber: values.proposalNumber });
          onSuccess?.();
        })
        .catch(async (serverError) => {
          const permissionError = new FirestorePermissionError({ path: docRef.path, operation: 'update', requestResourceData: dataToSave });
          errorEmitter.emit('permission-error', permissionError);
        })
        .finally(() => setLoading(false));
    } else {
      const collectionRef = collection(firestore, 'commercialProposals');
      addDoc(collectionRef, dataToSave)
        .then((docRef) => {
          toast({ title: 'Proposta criada!', description: `A proposta ${values.proposalNumber} foi criada.` });
          logUserAction(firestore, auth, 'create_proposal', { proposalId: docRef.id, proposalNumber: values.proposalNumber });
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
  
  const DateInput = ({ field, label }: { field: any; label: string }) => {
    const [inputValue, setInputValue] = React.useState(
        field.value ? format(field.value, 'dd/MM/yyyy') : ''
    );

    React.useEffect(() => {
        if (field.value && field.value instanceof Date && !isNaN(field.value.getTime())) {
            setInputValue(format(field.value, 'dd/MM/yyyy'));
        } else if (!field.value) {
            setInputValue('');
        }
    }, [field.value]);

    const handleDateInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      let value = e.target.value.replace(/\D/g, '');
      if (value.length > 2) value = `${value.slice(0, 2)}/${value.slice(2)}`;
      if (value.length > 5) value = `${value.slice(0, 5)}/${value.slice(5)}`;
      if (value.length > 10) value = value.slice(0, 10);
      setInputValue(value);
  
      if (value.length === 10) {
        const parsedDate = parse(value, 'dd/MM/yyyy', new Date());
        if (!isNaN(parsedDate.getTime())) {
          field.onChange(parsedDate);
        } else {
          form.setError(field.name, { type: 'manual', message: 'Data inválida' });
        }
      }
    };
  
    const handleDateSelect = (date: Date | undefined) => {
      field.onChange(date);
      if (date) {
        setInputValue(format(date, 'dd/MM/yyyy'));
      }
    };
  
    return (
      <FormItem className="flex flex-col">
        <FormLabel>{label}</FormLabel>
        <Popover>
          <PopoverTrigger asChild>
             <div className="relative">
                <FormControl>
                    <Input 
                        placeholder="DD/MM/AAAA"
                        value={inputValue}
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
              initialFocus
            />
          </PopoverContent>
        </Popover>
        <FormMessage />
      </FormItem>
    );
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>{currentItem ? 'Editar Proposta Comercial' : 'Adicionar Nova Proposta Comercial'}</DialogTitle>
        <DialogDescription>
            {currentItem ? 'Atualize os detalhes da proposta abaixo.' : 'Preencha os detalhes para criar uma nova proposta comercial.'}
        </DialogDescription>
      </DialogHeader>
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
            name="empreendimento"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Empreendimento</FormLabel>
                <FormControl>
                    <Input placeholder="Nome do empreendimento ou propriedade" {...field} />
                </FormControl>
                 <FormDescription>Este campo é para identificação interna e não cria vínculo com outros cadastros.</FormDescription>
                <FormMessage />
                </FormItem>
            )}
            />
          <FormField
            control={form.control}
            name="proposalNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Número da Proposta</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: PROP-2024-001" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="space-y-4 rounded-md border p-4">
              <div className="flex justify-between items-center">
                <h3 className="text-base font-semibold">Itens da Proposta</h3>
                <div className='flex gap-2'>
                    <Button size="sm" type="button" variant="outline" onClick={() => setIsServiceModalOpen(true)}>
                        <List className="mr-2 h-4 w-4" /> Adicionar da Tabela
                    </Button>
                    <Button size="sm" type="button" onClick={() => append({ description: '', value: 0 })}>
                        <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Manual
                    </Button>
                </div>
              </div>
              <div className="space-y-4">
                {fields.map((field, index) => (
                    <div key={field.id} className="flex items-end gap-2 border p-2 rounded-md">
                        <FormField
                            control={form.control}
                            name={`items.${index}.description`}
                            render={({ field }) => (
                                <FormItem className="flex-1">
                                    <FormLabel className="text-xs">Descrição do Serviço</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="Ex: Elaboração de RCA" {...field} className="min-h-[40px]" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name={`items.${index}.value`}
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-xs">Valor (R$)</FormLabel>
                                    <FormControl>
                                        <CurrencyInput
                                            className="w-40 text-right"
                                            value={field.value}
                                            onChange={field.onChange}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <Button type="button" variant="destructive" size="icon" className="h-9 w-9" onClick={() => remove(index)}>
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                ))}
                {form.formState.errors.items?.root && (
                     <p className="text-sm font-medium text-destructive">{form.formState.errors.items.root.message}</p>
                )}
              </div>
              <Separator />
               <div className="flex justify-end items-center gap-4">
                    <span className="font-semibold">Valor Total:</span>
                    <span className="text-xl font-bold">{formatCurrencyBRL(totalAmount)}</span>
                </div>
          </div>
           <FormField
              control={form.control}
              name="paymentTerms"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Forma de Pagamento</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Descreva a forma de pagamento..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                  control={form.control}
                  name="proposalDate"
                  render={({ field }) => <DateInput field={field} label="Data de Emissão" />}
              />
              <FormField
                  control={form.control}
                  name="validUntilDate"
                  render={({ field }) => <DateInput field={field} label="Válido Até" />}
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
                    {proposalStatuses.map(s => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>Cancelar</Button>
            <Button type="submit" disabled={loading}>
              {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando...</> : 'Salvar Proposta'}
            </Button>
          </DialogFooter>
        </form>
      </Form>
      <Dialog open={isServiceModalOpen} onOpenChange={setIsServiceModalOpen}>
        <DialogContent className="sm:max-w-xl">
            <DialogHeader>
                <DialogTitle>Selecionar Serviço da Tabela</DialogTitle>
                <DialogDescription>Clique em um serviço para adicioná-lo à proposta.</DialogDescription>
            </DialogHeader>
            <div className="max-h-[60vh] overflow-y-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Serviço</TableHead>
                            <TableHead className="text-right">Preço</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoadingServices && <TableRow><TableCell colSpan={2}><Skeleton className="h-10 w-full" /></TableCell></TableRow>}
                        {services?.map(service => (
                            <TableRow key={service.id} onClick={() => handleAddServiceFromTable(service)} className="cursor-pointer">
                                <TableCell className="font-medium">{service.name}</TableCell>
                                <TableCell className="text-right">{formatCurrencyBRL(service.price)}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
             <DialogFooter>
                <Button variant="outline" onClick={() => setIsServiceModalOpen(false)}>Fechar</Button>
             </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
