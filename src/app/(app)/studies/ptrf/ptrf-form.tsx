
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
import type { PTRF, Empreendedor as Client, Project } from '@/lib/types';
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
import { Textarea } from '@/components/ui/textarea';


const formSchema = z.object({
  status: z.enum(['Rascunho', 'Aprovado']).optional(),
  requerente: z.object({
    clientId: z.string().optional(),
    nome: z.string().min(1, "O nome do requerente é obrigatório."),
    cpfCnpj: z.string().min(1, "O CPF/CNPJ do requerente é obrigatório."),
  }),
  empreendimento: z.object({
    projectId: z.string().optional(),
    nome: z.string().min(1, "O nome do empreendimento é obrigatório."),
    car: z.string().min(1, "O N.º do Recibo do CAR é obrigatório."),
  }),
  responsavelTecnico: z.object({
    nome: z.string().min(1, "O nome do responsável é obrigatório."),
    cpf: z.string().min(1, "O CPF do responsável é obrigatório."),
    formacao: z.string().min(1, "A formação é obrigatória."),
    registroConselho: z.string().min(1, "O registro no conselho é obrigatório."),
  }),
  objetivoDescricao: z.string().min(1, "O objetivo é obrigatório."),
  referenciasBibliograficas: z.string().optional(),
});


type PtrfFormValues = z.infer<typeof formSchema>;

interface PtrfFormProps {
  currentItem?: PTRF | null;
  onSuccess?: () => void;
}

export function PtrfForm({ currentItem, onSuccess }: PtrfFormProps) {
  const [loading, setLoading] = React.useState(false);
  const { toast } = useToast();
  const { firestore } = useFirebase();

  const clientsQuery = useMemoFirebase(() => firestore ? collection(firestore, 'clients') : null, [firestore]);
  const { data: clients, isLoading: isLoadingClients } = useCollection<Client>(clientsQuery);
  const projectsQuery = useMemoFirebase(() => firestore ? collection(firestore, 'projects') : null, [firestore]);
  const { data: projects, isLoading: isLoadingProjects } = useCollection<Project>(projectsQuery);

  const form = useForm<PtrfFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: currentItem ? {
      ...currentItem
    } : {
      status: 'Rascunho',
      requerente: { clientId: '', nome: '', cpfCnpj: '' },
      empreendimento: { projectId: '', nome: '', car: '' },
      responsavelTecnico: { nome: '', cpf: '', formacao: '', registroConselho: '' },
      objetivoDescricao: '',
      referenciasBibliograficas: '',
    },
  });

  const selectedRequerenteId = form.watch('requerente.clientId');
  const selectedProjectId = form.watch('empreendimento.projectId');


  React.useEffect(() => {
    if (selectedRequerenteId) {
      const client = clients?.find(c => c.id === selectedRequerenteId);
      if (client) {
        form.setValue('requerente.nome', client.name);
        form.setValue('requerente.cpfCnpj', client.cpfCnpj || '');
      }
    }
  }, [selectedRequerenteId, clients, form]);

  React.useEffect(() => {
    if (selectedProjectId) {
      const project = projects?.find(p => p.id === selectedProjectId);
      if (project) {
        form.setValue('empreendimento.nome', project.fantasyName || project.propertyName);
        // @ts-ignore
        form.setValue('empreendimento.car', project.car || '');
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
        status: status,
    };

    if (currentItem) {
      const docRef = doc(firestore, 'ptrfs', currentItem.id);
      updateDoc(docRef, dataToSave)
        .then(() => {
          toast({
            title: 'PTRF atualizado!',
            description: 'O formulário foi salvo com sucesso.',
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
      const collectionRef = collection(firestore, 'ptrfs');
      addDoc(collectionRef, dataToSave)
        .then(() => {
          toast({
            title: 'PTRF criado!',
            description: `O formulário para ${values.empreendimento.nome} foi criado com sucesso.`,
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
                <h3 className="text-lg font-medium">1. Identificação</h3>
                <FormField
                    control={form.control}
                    name="requerente.clientId"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Buscar Requerente Cadastrado</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoadingClients}>
                            <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder={isLoadingClients ? "Carregando..." : "Selecione um cliente para preencher"} />
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
                <FormField control={form.control} name="requerente.nome" render={({ field }) => (<FormItem><FormLabel>Nome do Requerente</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="requerente.cpfCnpj" render={({ field }) => (<FormItem><FormLabel>CPF/CNPJ</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
            </div>
             <div className="p-4 border rounded-md space-y-4">
                <h3 className="text-lg font-medium">2. Dados do Imóvel Rural</h3>
                 <FormField
                    control={form.control}
                    name="empreendimento.projectId"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Buscar Empreendimento Cadastrado</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoadingProjects}>
                            <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder={isLoadingProjects ? "Carregando..." : "Selecione um empreendimento"} />
                            </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                            {projects?.map(project => (
                                <SelectItem key={project.id} value={project.id}>{project.propertyName}</SelectItem>
                            ))}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField control={form.control} name="empreendimento.nome" render={({ field }) => (<FormItem><FormLabel>Denominação do Imóvel</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                 <FormField control={form.control} name="empreendimento.car" render={({ field }) => (<FormItem><FormLabel>N.º Recibo do CAR</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
            </div>
             <div className="p-4 border rounded-md space-y-4">
                 <h3 className="text-lg font-medium">3. Objetivo</h3>
                 <FormField
                    control={form.control}
                    name="objetivoDescricao"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Objetivo do PTRF</FormLabel>
                        <FormControl>
                            <Textarea
                                placeholder="Descrever de forma clara e sucinta o objetivo do PTRF..."
                                {...field}
                            />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
            <div className="p-4 border rounded-md space-y-4">
                <h3 className="text-lg font-medium">4. Responsável Técnico</h3>
                <FormField control={form.control} name="responsavelTecnico.nome" render={({ field }) => (<FormItem><FormLabel>Nome</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="responsavelTecnico.cpf" render={({ field }) => (<FormItem><FormLabel>CPF</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="responsavelTecnico.formacao" render={({ field }) => (<FormItem><FormLabel>Formação</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="responsavelTecnico.registroConselho" render={({ field }) => (<FormItem><FormLabel>Registro no Conselho de Classe</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
            </div>
            <div className="p-4 border rounded-md space-y-4">
                 <h3 className="text-lg font-medium">5. Referências Bibliográficas</h3>
                 <FormField
                    control={form.control}
                    name="referenciasBibliograficas"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Referências</FormLabel>
                        <FormControl>
                            <Textarea
                                placeholder="Listar as referências utilizadas para elaboração do projeto."
                                {...field}
                            />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
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
