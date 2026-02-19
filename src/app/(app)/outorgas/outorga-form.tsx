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
import { format, parse } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { useToast } from '@/hooks/use-toast';
import type { WaterPermit, PermitStatus, Empreendedor, Project } from '@/lib/types';
import { useFirebase, errorEmitter, useCollection, useMemoFirebase } from '@/firebase';
import { FirestorePermissionError } from '@/firebase/errors';
import { collection, doc, addDoc, updateDoc } from 'firebase/firestore';
import { DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

const formSchema = z.object({
  empreendedorId: z.string().min(1, 'Selecione um empreendedor.'),
  projectId: z.string().optional(),
  permitNumber: z.string().min(1, 'O número da portaria é obrigatório.'),
  processNumber: z.string().min(1, 'O número do processo é obrigatório.'),
  issueDate: z.date({ required_error: 'A data de emissão é obrigatória.' }),
  expirationDate: z.date({ required_error: 'A data de vencimento é obrigatória.' }),
  status: z.enum(['Válida', 'Vencida', 'Em Renovação', 'Suspensa', 'Cancelada'], { required_error: 'Selecione o status.'}),
  description: z.string().min(1, 'A finalidade é obrigatória.'),
}).refine(data => data.expirationDate > data.issueDate, {
  message: 'A data de vencimento deve ser posterior à data de emissão.',
  path: ['expirationDate'],
});


type FormValues = z.infer<typeof formSchema>;

interface OutorgaFormProps {
  currentItem?: WaterPermit | null;
  onSuccess?: () => void;
}

const permitStatuses: { value: PermitStatus, label: string }[] = [
    { value: 'Válida', label: 'Válida' },
    { value: 'Vencida', label: 'Vencida' },
    { value: 'Em Renovação', label: 'Em Renovação' },
    { value: 'Suspensa', label: 'Suspensa' },
    { value: 'Cancelada', label: 'Cancelada' },
];

export function OutorgaForm({ currentItem, onSuccess }: OutorgaFormProps) {
  const [loading, setLoading] = React.useState(false);
  const [fileUrl, setFileUrl] = React.useState<string | null>(currentItem?.fileUrl || null);

  const { toast } = useToast();
  const { firestore } = useFirebase();

  const empreendedoresQuery = useMemoFirebase(() => (firestore ? collection(firestore, 'empreendedores') : null), [firestore]);
  const { data: empreendedores, isLoading: isLoadingEmpreendedores } = useCollection<Empreendedor>(empreendedoresQuery);

  const projectsQuery = useMemoFirebase(() => (firestore ? collection(firestore, 'projects') : null), [firestore]);
  const { data: allProjects, isLoading: isLoadingProjects } = useCollection<Project>(projectsQuery);


  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {},
  });
  
  React.useEffect(() => {
    const defaultValues = {
        empreendedorId: currentItem?.empreendedorId || '',
        projectId: currentItem?.projectId || '',
        permitNumber: currentItem?.permitNumber || '',
        processNumber: currentItem?.processNumber || '',
        issueDate: currentItem ? new Date(currentItem.issueDate) : undefined,
        expirationDate: currentItem ? new Date(currentItem.expirationDate) : undefined,
        status: currentItem?.status,
        description: currentItem?.description || '',
    };
    // @ts-ignore
    form.reset(defaultValues);
    setFileUrl(currentItem?.fileUrl || null);
  }, [currentItem, form]);
  
  const selectedEmpreendedorId = form.watch('empreendedorId');

  const filteredProjects = React.useMemo(() => {
    if (!selectedEmpreendedorId || !allProjects) return [];
    return allProjects.filter(p => p.empreendedorId === selectedEmpreendedorId);
  }, [selectedEmpreendedorId, allProjects]);

  React.useEffect(() => {
    if(form.getValues('empreendedorId') !== selectedEmpreendedorId) {
      form.setValue('projectId', '');
    }
  }, [selectedEmpreendedorId, form]);

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
        fileUrl: fileUrl || '',
        pontosDeMonitoramento: currentItem?.pontosDeMonitoramento || [] 
    };


    if (currentItem) {
      const docRef = doc(firestore, 'outorgas', currentItem.id);
      updateDoc(docRef, dataToSave)
        .then(() => {
          toast({
            title: 'Outorga atualizada!',
            description: 'As informações da outorga foram salvas com sucesso.',
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
        .finally(() => setLoading(false));
    } else {
      const collectionRef = collection(firestore, 'outorgas');
      addDoc(collectionRef, dataToSave)
        .then(() => {
          toast({
            title: 'Outorga criada!',
            description: `A outorga ${values.permitNumber} foi adicionada com sucesso.`,
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
        .finally(() => setLoading(false));
    }
  }

  const DateInput = ({ field, label, disabledFuture, disabledPast }: { field: any; label: string; disabledFuture?: boolean; disabledPast?: boolean; }) => {
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
              disabled={(date) => (disabledFuture && date > new Date()) || (disabledPast && date < new Date("1900-01-01")) || false}
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
        <DialogTitle>{currentItem ? 'Editar Outorga' : 'Adicionar Nova Outorga'}</DialogTitle>
        <DialogDescription>
          {currentItem
            ? 'Atualize os detalhes da outorga abaixo.'
            : 'Preencha os detalhes para criar uma nova outorga.'}
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
                <Select onValueChange={field.onChange} value={field.value}>
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
            name="projectId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Empreendimento (Opcional)</FormLabel>
                <Select onValueChange={field.onChange} value={field.value || ''} disabled={!selectedEmpreendedorId || isLoadingProjects}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={!selectedEmpreendedorId ? 'Selecione um empreendedor primeiro' : "Selecione o empreendimento"} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {filteredProjects?.map(proj => (
                      <SelectItem key={proj.id} value={proj.id}>{proj.propertyName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="permitNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Número da Portaria</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: Portaria IGAM nº 123" {...field} />
                </FormControl>
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="issueDate"
                render={({ field }) => <DateInput field={field} label="Data de Emissão" disabledFuture />}
              />
              <FormField
                control={form.control}
                name="expirationDate"
                render={({ field }) => <DateInput field={field} label="Data de Vencimento" />}
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
                <FormLabel>Finalidade</FormLabel>
                <FormControl>
                  <Textarea placeholder="Descreva a finalidade da outorga (e.g., Captação de água subterrânea, lançamento de efluentes...)" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onSuccess}>Cancelar</Button>
            <Button type="submit" disabled={loading}>
              {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando...</> : 'Salvar Outorga'}
            </Button>
          </DialogFooter>
        </form>
      </Form>
    </>
  );
}
