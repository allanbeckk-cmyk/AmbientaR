
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import type { ManualMonitoringLog } from '@/lib/types';
import { useFirebase, errorEmitter } from '@/firebase';
import { FirestorePermissionError } from '@/firebase/errors';
import { collection, doc, addDoc, updateDoc } from 'firebase/firestore';
import { DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const formSchema = z.object({
  logDate: z.date({ required_error: 'A data é obrigatória.' }),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Formato de hora inválido (HH:mm)."),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Formato de hora inválido (HH:mm)."),
  flowRateLps: z.coerce.number().positive('A vazão deve ser um número positivo.'),
  flowRateM3h: z.coerce.number().positive('A vazão deve ser um número positivo.'),
  horimeterStart: z.coerce.number().nonnegative('O horímetro deve ser um número não negativo.'),
  horimeterEnd: z.coerce.number().nonnegative('O horímetro deve ser um número não negativo.'),
}).refine(data => data.horimeterEnd >= data.horimeterStart, {
    message: 'O horímetro final deve ser maior ou igual ao inicial.',
    path: ['horimeterEnd'],
});

type FormValues = z.infer<typeof formSchema>;

interface MonitoringFormProps {
  currentItem?: ManualMonitoringLog | null;
  outorgaId: string;
  pontoId: string;
  onSuccess?: () => void;
}

export function MonitoringForm({ currentItem, outorgaId, pontoId, onSuccess }: MonitoringFormProps) {
  const [loading, setLoading] = React.useState(false);
  const { toast } = useToast();
  const { firestore, user } = useFirebase();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      logDate: currentItem ? new Date(currentItem.logDate) : new Date(),
      startTime: currentItem?.startTime || '',
      endTime: currentItem?.endTime || '',
      flowRateLps: currentItem?.flowRateLps || 0,
      flowRateM3h: currentItem?.flowRateM3h || 0,
      horimeterStart: currentItem?.horimeterStart || 0,
      horimeterEnd: currentItem?.horimeterEnd || 0,
    },
  });

  async function onSubmit(values: FormValues) {
    setLoading(true);

    if (!firestore || !user) {
      toast({ variant: 'destructive', title: 'Erro de autenticação.' });
      setLoading(false);
      return;
    }
    
    const dataToSave = {
        ...values,
        logDate: values.logDate.toISOString(),
        outorgaId,
        pontoId,
        userId: user.uid,
    };

    if (currentItem) {
      const docRef = doc(firestore, 'manualMonitoringLogs', currentItem.id);
      updateDoc(docRef, dataToSave)
        .then(() => {
          toast({ title: 'Lançamento atualizado!', description: 'O registro foi salvo com sucesso.' });
          onSuccess?.();
        })
        .catch(async (serverError) => {
          const permissionError = new FirestorePermissionError({ path: docRef.path, operation: 'update', requestResourceData: dataToSave });
          errorEmitter.emit('permission-error', permissionError);
        })
        .finally(() => setLoading(false));
    } else {
      const collectionRef = collection(firestore, 'manualMonitoringLogs');
      addDoc(collectionRef, dataToSave)
        .then(() => {
          toast({ title: 'Lançamento criado!', description: `O registro para ${format(values.logDate, "PPP", { locale: ptBR })} foi criado.` });
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
    <>
      <DialogHeader>
        <DialogTitle>{currentItem ? 'Editar Lançamento' : 'Novo Lançamento de Monitoramento'}</DialogTitle>
      </DialogHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="h-full flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto pr-6 pl-1 -mr-6 -ml-1 space-y-4">
          <FormField
              control={form.control}
              name="logDate"
              render={({ field }) => (
                  <FormItem className="flex flex-col">
                  <FormLabel>Data do Lançamento</FormLabel>
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
                          <Calendar mode="single" selected={field.value} onSelect={field.onChange} disabled={(date) => date > new Date()} initialFocus />
                      </PopoverContent>
                  </Popover>
                  <FormMessage />
                  </FormItem>
              )}
          />
          <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="startTime" render={({ field }) => (<FormItem><FormLabel>Hora que ligou</FormLabel><FormControl><Input placeholder="HH:mm" {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="endTime" render={({ field }) => (<FormItem><FormLabel>Hora que desligou</FormLabel><FormControl><Input placeholder="HH:mm" {...field} /></FormControl><FormMessage /></FormItem>)} />
          </div>
           <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="horimeterStart" render={({ field }) => (<FormItem><FormLabel>Horímetro Início</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="horimeterEnd" render={({ field }) => (<FormItem><FormLabel>Horímetro Fim</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
          </div>
           <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="flowRateLps" render={({ field }) => (<FormItem><FormLabel>Vazão (L/s)</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="flowRateM3h" render={({ field }) => (<FormItem><FormLabel>Vazão (m³/h)</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>)} />
          </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onSuccess}>Cancelar</Button>
            <Button type="submit" disabled={loading}>
              {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando...</> : 'Salvar'}
            </Button>
          </DialogFooter>
        </form>
      </Form>
    </>
  );
}
