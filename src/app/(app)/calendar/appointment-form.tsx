
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
import { Input } from '@/components/ui/input';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import type { Appointment, Client, UserRole } from '@/lib/types';
import { useFirebase, errorEmitter, useCollection, useMemoFirebase } from '@/firebase';
import { FirestorePermissionError } from '@/firebase/errors';
import { collection, doc, addDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';

const formSchema = z.object({
  description: z.string().min(1, 'A descrição é obrigatória.'),
  clientId: z.string().optional(),
  type: z.enum(['appointment', 'deadline', 'audit']),
  date: z.date({ required_error: 'A data do compromisso é obrigatória.' }),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Formato de hora inválido (HH:mm)."),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Formato de hora inválido (HH:mm)."),
  location: z.string().optional(),
}).refine(data => {
    const [startHour, startMinute] = data.startTime.split(':').map(Number);
    const [endHour, endMinute] = data.endTime.split(':').map(Number);
    return endHour > startHour || (endHour === startHour && endMinute > startMinute);
}, {
    message: "A hora final deve ser posterior à hora inicial.",
    path: ['endTime'],
});


type FormValues = z.infer<typeof formSchema>;

interface AppointmentFormProps {
  currentItem?: Appointment | null;
  onSuccess?: () => void;
}

const eventTypes: { value: Appointment['type'], label: string }[] = [
  { value: 'appointment', label: 'Reunião' },
  { value: 'deadline', label: 'Prazo' },
  { value: 'audit', label: 'Auditoria' },
];

export function AppointmentForm({ currentItem, onSuccess }: AppointmentFormProps) {
  const [loading, setLoading] = React.useState(false);
  const { toast } = useToast();
  const { firestore, user } = useFirebase();

  const clientsQuery = useMemoFirebase(() => firestore ? collection(firestore, 'clients') : null, [firestore]);
  const { data: clients, isLoading: isLoadingClients } = useCollection<Client>(clientsQuery);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: currentItem ? {
        description: currentItem.description,
        clientId: currentItem.clientId || '',
        type: currentItem.type,
        date: new Date(currentItem.startTime),
        startTime: format(new Date(currentItem.startTime), 'HH:mm'),
        endTime: format(new Date(currentItem.endTime), 'HH:mm'),
        location: currentItem.location || '',
    } : {
        description: '',
        clientId: '',
        type: 'appointment',
        date: new Date(),
        startTime: '09:00',
        endTime: '10:00',
        location: '',
    },
  });

  const combineDateAndTime = (date: Date, time: string): Date => {
      const [hours, minutes] = time.split(':').map(Number);
      const newDate = new Date(date);
      newDate.setHours(hours, minutes, 0, 0);
      return newDate;
  }

  async function onSubmit(values: FormValues) {
    setLoading(true);

    if (!firestore || !user) {
      toast({ variant: 'destructive', title: 'Firebase não inicializado.' });
      setLoading(false);
      return;
    }
    
    const dataToSave: Omit<Appointment, 'id'> = {
      description: values.description,
      clientId: values.clientId,
      type: values.type,
      startTime: combineDateAndTime(values.date, values.startTime).toISOString(),
      endTime: combineDateAndTime(values.date, values.endTime).toISOString(),
      location: values.location,
      ownerId: user.uid,
      ownerRole: user.role,
    };

    if (currentItem) {
      const docRef = doc(firestore, 'appointments', currentItem.id);
      updateDoc(docRef, dataToSave)
        .then(() => {
          toast({ title: 'Compromisso atualizado!' });
          onSuccess?.();
        })
        .catch(async (serverError) => {
          const permissionError = new FirestorePermissionError({ path: docRef.path, operation: 'update', requestResourceData: dataToSave });
          errorEmitter.emit('permission-error', permissionError);
        })
        .finally(() => setLoading(false));
    } else {
      const collectionRef = collection(firestore, 'appointments');
      addDoc(collectionRef, { ...dataToSave, createdAt: serverTimestamp() })
        .then(() => {
          toast({ title: 'Compromisso criado!' });
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
        <DialogTitle>{currentItem ? 'Editar Compromisso' : 'Novo Compromisso'}</DialogTitle>
        <DialogDescription>
          {currentItem ? 'Atualize os detalhes do seu compromisso.' : 'Preencha os campos para criar um novo compromisso.'}
        </DialogDescription>
      </DialogHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="h-full flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto pr-6 pl-1 -mr-6 -ml-1 space-y-4">
            <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem><FormLabel>Descrição</FormLabel><FormControl><Textarea placeholder="Descreva o compromisso..." {...field} /></FormControl><FormMessage /></FormItem>
            )}/>
            <FormField control={form.control} name="clientId" render={({ field }) => (
                <FormItem><FormLabel>Cliente (Opcional)</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoadingClients}>
                    <FormControl><SelectTrigger><SelectValue placeholder={isLoadingClients ? "Carregando..." : "Selecione um cliente"} /></SelectTrigger></FormControl>
                    <SelectContent>{clients?.map(client => <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>)}</SelectContent>
                </Select><FormMessage /></FormItem>
            )}/>
            <FormField control={form.control} name="type" render={({ field }) => (
                <FormItem><FormLabel>Tipo de Compromisso</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>{eventTypes.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                </Select><FormMessage /></FormItem>
            )}/>
            <FormField control={form.control} name="date" render={({ field }) => (
                <FormItem className="flex flex-col"><FormLabel>Data</FormLabel>
                <Popover><PopoverTrigger asChild><FormControl>
                    <Button variant={"outline"} className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                    {field.value ? format(field.value, "PPP", { locale: ptBR }) : <span>Escolha uma data</span>}
                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                </FormControl></PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                </PopoverContent></Popover><FormMessage /></FormItem>
            )}/>
            <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="startTime" render={({ field }) => (
                    <FormItem><FormLabel>Hora Início</FormLabel><FormControl><Input type="time" {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
                <FormField control={form.control} name="endTime" render={({ field }) => (
                    <FormItem><FormLabel>Hora Fim</FormLabel><FormControl><Input type="time" {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
            </div>
             <FormField control={form.control} name="location" render={({ field }) => (
                <FormItem><FormLabel>Local (Opcional)</FormLabel><FormControl><Input placeholder="Ex: Escritório do cliente" {...field} /></FormControl><FormMessage /></FormItem>
            )}/>
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
