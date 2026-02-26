
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
import { useToast } from '@/hooks/use-toast';
import type { Condicionante, PermitStatus, Project, License, WaterPermit, EnvironmentalIntervention } from '@/lib/types';
import { useFirebase, errorEmitter, useCollection, useMemoFirebase } from '@/firebase';
import { FirestorePermissionError } from '@/firebase/errors';
import { collection, doc, addDoc, updateDoc } from 'firebase/firestore';
import { DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

const formSchema = z.object({
  referenceId: z.string().min(1, 'Selecione um documento de referência.'),
  referenceType: z.enum(['licenca', 'outorga', 'intervencao']),
  description: z.string().min(1, 'A descrição da condicionante é obrigatória.'),
  dueDate: z.date({ required_error: 'A data de vencimento é obrigatória.' }),
  status: z.enum(['Pendente', 'Cumprida', 'Atrasada', 'Não Aplicável'], { required_error: 'Selecione o status.'}),
  recurrence: z.enum(['Única', 'Mensal', 'Trimestral', 'Semestral', 'Anual'], { required_error: 'Selecione a recorrência.'}),
});

type FormValues = z.infer<typeof formSchema>;

interface ComplianceFormProps {
  currentItem?: Condicionante | null;
  referenceType: 'licenca' | 'outorga' | 'intervencao';
  onSuccess?: () => void;
}

const statuses: { value: Condicionante['status'], label: string }[] = [
    { value: 'Pendente', label: 'Pendente' },
    { value: 'Cumprida', label: 'Cumprida' },
    { value: 'Atrasada', label: 'Atrasada' },
    { value: 'Não Aplicável', label: 'Não Aplicável' },
];

const recurrences: { value: Condicionante['recurrence'], label: string }[] = [
    { value: 'Única', label: 'Única' },
    { value: 'Mensal', label: 'Mensal' },
    { value: 'Trimestral', label: 'Trimestral' },
    { value: 'Semestral', label: 'Semestral' },
    { value: 'Anual', label: 'Anual' },
];

export function ComplianceForm({ currentItem, referenceType, onSuccess }: ComplianceFormProps) {
  const [loading, setLoading] = React.useState(false);
  const { toast } = useToast();
  const { firestore } = useFirebase();
  
  const licensesQuery = useMemoFirebase(() => firestore && referenceType === 'licenca' ? collection(firestore, 'licenses') : null, [firestore, referenceType]);
  const { data: licenses, isLoading: isLoadingLicenses } = useCollection<License>(licensesQuery);

  const projectsQuery = useMemoFirebase(() => firestore && referenceType === 'licenca' ? collection(firestore, 'projects') : null, [firestore, referenceType]);
  const { data: projects } = useCollection<Project>(projectsQuery);
  const projectsMap = React.useMemo(() => new Map(projects?.map(p => [p.id, p.propertyName])), [projects]);

  const outorgasQuery = useMemoFirebase(() => firestore && referenceType === 'outorga' ? collection(firestore, 'outorgas') : null, [firestore, referenceType]);
  const { data: outorgas, isLoading: isLoadingOutorgas } = useCollection<WaterPermit>(outorgasQuery);
  
  const intervencoesQuery = useMemoFirebase(() => firestore && referenceType === 'intervencao' ? collection(firestore, 'intervencoes') : null, [firestore, referenceType]);
  const { data: intervencoes, isLoading: isLoadingIntervencoes } = useCollection<EnvironmentalIntervention>(intervencoesQuery);


  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      referenceId: currentItem?.referenceId || '',
      referenceType: currentItem?.referenceType || referenceType,
      description: currentItem?.description || '',
      dueDate: currentItem?.dueDate ? new Date(currentItem.dueDate) : undefined,
      status: currentItem?.status || undefined,
      recurrence: currentItem?.recurrence || undefined,
    },
  });
  
  // Update referenceType when it changes from props
  React.useEffect(() => {
    form.setValue('referenceType', referenceType);
  }, [referenceType, form]);


  const referenceItems = React.useMemo(() => {
    if (referenceType === 'licenca') {
      return licenses?.map(l => ({
        id: l.id,
        name: `${l.permitNumber} - ${l.permitType} (${projectsMap.get(l.projectId) || 'Empreendimento'})`
      })) || [];
    }
    if (referenceType === 'outorga') {
      return outorgas?.map(o => ({ id: o.id, name: `${o.permitNumber} - ${o.description}` })) || [];
    }
    if (referenceType === 'intervencao') {
        return intervencoes?.map(i => ({ id: i.id, name: `${i.processNumber} - ${i.description}` })) || [];
    }
    return [];
  }, [referenceType, licenses, projectsMap, outorgas, intervencoes]);
  
  const isLoadingReference = isLoadingLicenses || isLoadingOutorgas || isLoadingIntervencoes;

  const getReferenceLabel = () => {
    switch (referenceType) {
        case 'licenca': return 'Licença de Referência';
        case 'outorga': return 'Outorga de Referência';
        case 'intervencao': return 'Intervenção de Referência';
        default: return 'Documento de Referência';
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
        dueDate: values.dueDate.toISOString(),
    };


    if (currentItem) {
      const docRef = doc(firestore, 'condicionantes', currentItem.id);
      updateDoc(docRef, dataToSave)
        .then(() => {
          toast({
            title: 'Condicionante atualizada!',
            description: 'As informações da condicionante foram salvas com sucesso.',
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
      const collectionRef = collection(firestore, 'condicionantes');
      addDoc(collectionRef, dataToSave)
        .then(() => {
          toast({
            title: 'Condicionante criada!',
            description: `A condicionante foi adicionada com sucesso.`,
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
        <DialogTitle>{currentItem ? 'Editar Condicionante' : 'Adicionar Nova Condicionante'}</DialogTitle>
        <DialogDescription>
          {currentItem
            ? 'Atualize os detalhes da condicionante abaixo.'
            : 'Preencha os detalhes para criar uma nova condicionante.'}
        </DialogDescription>
      </DialogHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="h-full flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto pr-6 pl-1 -mr-6 -ml-1 space-y-4">
          <FormField
            control={form.control}
            name="referenceId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {getReferenceLabel()}
                </FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoadingReference}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={isLoadingReference ? "Carregando..." : "Selecione um documento"} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {referenceItems.map(item => (
                      <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>
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
                <FormLabel>Descrição da Condicionante</FormLabel>
                <FormControl>
                  <Textarea placeholder="Descreva a condicionante..." {...field} />
                </FormControl>
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      {statuses.map(s => (
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
              name="recurrence"
              render={({ field }) => (
                  <FormItem>
                  <FormLabel>Recorrência</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                      <SelectTrigger>
                          <SelectValue placeholder="Selecione a recorrência" />
                      </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                      {recurrences.map(r => (
                          <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                      ))}
                      </SelectContent>
                  </Select>
                  <FormMessage />
                  </FormItem>
              )}
              />
          </div>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onSuccess}>Cancelar</Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Salvar Condicionante'
              )}
            </Button>
          </DialogFooter>
        </form>
      </Form>
    </>
  );
}
