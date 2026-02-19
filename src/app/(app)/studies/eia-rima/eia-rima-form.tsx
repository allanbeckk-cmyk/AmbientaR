
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
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { EiaRima, Empreendedor as Client, Project } from '@/lib/types';
import { useFirebase, errorEmitter, useCollection, useMemoFirebase } from '@/firebase';
import { FirestorePermissionError } from '@/firebase/errors';
import { collection, doc, addDoc, updateDoc } from 'firebase/firestore';
import { DialogFooter } from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const formSchema = z.object({
  status: z.enum(['Rascunho', 'Aprovado']).optional(),
  requerente: z.object({
    clientId: z.string().optional(),
    nome: z.string().min(1, "O nome do requerente é obrigatório."),
  }),
  empreendimento: z.object({
    projectId: z.string().optional(),
    nome: z.string().min(1, "O nome do empreendimento é obrigatório."),
  }),
  processo: z.string().min(1, "O número do processo é obrigatório.")
});

type EiaRimaFormValues = z.infer<typeof formSchema>;

interface EiaRimaFormProps {
  currentItem?: EiaRima | null;
  onSuccess?: () => void;
}

export function EiaRimaForm({ currentItem, onSuccess }: EiaRimaFormProps) {
  const [loading, setLoading] = React.useState(false);
  const { toast } = useToast();
  const { firestore } = useFirebase();

  const clientsQuery = useMemoFirebase(() => firestore ? collection(firestore, 'clients') : null, [firestore]);
  const { data: clients, isLoading: isLoadingClients } = useCollection<Client>(clientsQuery);
  const projectsQuery = useMemoFirebase(() => firestore ? collection(firestore, 'projects') : null, [firestore]);
  const { data: projects, isLoading: isLoadingProjects } = useCollection<Project>(projectsQuery);

  const form = useForm<EiaRimaFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: currentItem || {
      status: 'Rascunho',
      requerente: { clientId: '', nome: '' },
      empreendimento: { projectId: '', nome: '' },
      processo: '',
    },
  });
  
  const selectedClientId = form.watch('requerente.clientId');
  const selectedProjectId = form.watch('empreendimento.projectId');


  React.useEffect(() => {
    if (selectedClientId) {
      const client = clients?.find(c => c.id === selectedClientId);
      if (client) {
        form.setValue('requerente.nome', client.name);
      }
    }
  }, [selectedClientId, clients, form]);

  React.useEffect(() => {
    if (selectedProjectId) {
      const project = projects?.find(p => p.id === selectedProjectId);
      if (project) {
        form.setValue('empreendimento.nome', project.fantasyName || project.propertyName);
      }
    }
  }, [selectedProjectId, projects, form]);

  async function handleSave(status: 'Rascunho' | 'Aprovado') {
    setLoading(true);

    const isValid = await form.trigger();
    if (!isValid && status === 'Aprovado') {
        toast({
            variant: 'destructive',
            title: 'Formulário Inválido',
            description: 'Por favor, corrija os erros antes de concluir.',
        });
        setLoading(false);
        return;
    }

    const values = form.getValues();

    if (!firestore) {
      toast({ variant: 'destructive', title: 'Firebase não inicializado.' });
      setLoading(false);
      return;
    }
    
    const dataToSave = {
        ...values,
        status,
    };

    if (currentItem) {
      const docRef = doc(firestore, 'eiaRimas', currentItem.id);
      updateDoc(docRef, dataToSave)
        .then(() => {
          toast({
            title: 'EIA/RIMA atualizado!',
            description: 'O estudo foi salvo com sucesso.',
          });
          if (status === 'Aprovado') onSuccess?.();
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
      const collectionRef = collection(firestore, 'eiaRimas');
      addDoc(collectionRef, dataToSave)
        .then(() => {
          toast({
            title: 'EIA/RIMA criado!',
            description: `O estudo para ${values.empreendimento.nome} foi criado.`,
          });
          form.reset();
          if (status === 'Aprovado') onSuccess?.();
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

  return (
    <Form {...form}>
      <form onSubmit={(e) => e.preventDefault()} className="h-full flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto pr-4 -mr-6 space-y-6">
            <div className="p-4 border rounded-md space-y-4">
                <h3 className="text-lg font-medium">Informações Gerais</h3>
                <FormField
                    control={form.control}
                    name="requerente.clientId"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Requerente</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoadingClients}>
                            <FormControl><SelectTrigger>
                                <SelectValue placeholder={isLoadingClients ? "Carregando..." : "Selecione um cliente para preencher"} />
                            </SelectTrigger></FormControl>
                            <SelectContent>{clients?.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                        </Select>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="empreendimento.projectId"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Empreendimento</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoadingProjects}>
                            <FormControl><SelectTrigger>
                                <SelectValue placeholder={isLoadingProjects ? "Carregando..." : "Selecione um empreendimento para preencher"} />
                            </SelectTrigger></FormControl>
                            <SelectContent>{projects?.map(p => <SelectItem key={p.id} value={p.id}>{p.propertyName}</SelectItem>)}</SelectContent>
                        </Select>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField control={form.control} name="processo" render={({ field }) => (<FormItem><FormLabel>Nº do Processo</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
            </div>
        </div>
        <DialogFooter>
          <Button variant="outline" type="button" onClick={onSuccess}>
            Voltar
          </Button>
           <Button variant="secondary" onClick={() => handleSave('Rascunho')} disabled={loading}>
                {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando...</> : 'Salvar Rascunho'}
            </Button>
            <Button onClick={() => handleSave('Aprovado')} disabled={loading}>
                {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Concluindo...</> : 'Concluir e Aprovar'}
            </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}

    