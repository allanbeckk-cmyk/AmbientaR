
'use client';

import * as React from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import {
  Form,
} from '@/components/ui/form';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { PIA, Empreendedor as Client, Project, PiaType } from '@/lib/types';
import { useFirebase, errorEmitter, useCollection, useMemoFirebase } from '@/firebase';
import { FirestorePermissionError } from '@/firebase/errors';
import { collection, doc, addDoc, updateDoc } from 'firebase/firestore';
import { DialogFooter } from '@/components/ui/dialog';
import { PiaFormInventario } from './pia-form-inventario';
import { useRouter } from 'next/navigation';
import { cleanEmptyValues } from '@/lib/utils';
import _ from 'lodash';


const formSchema = z.object({
    type: z.enum(['Simplificado', 'Corretivo', 'Inventário Florestal', 'Censo Florestal']),
    status: z.enum(['Rascunho', 'Aprovado']).optional(),
    requerente: z.object({
        clientId: z.string().optional(),
        nome: z.string().min(1, "O nome do requerente é obrigatório."),
        cpfCnpj: z.string().min(1, "O CPF/CNPJ do requerente é obrigatório."),
    }),
    empreendimento: z.object({
        projectId: z.string().optional(),
        nome: z.string().min(1, "O nome do empreendimento é obrigatório."),
    }),
}).passthrough(); // Permite campos extras que serão validados pelo schema específico

type PiaFormValues = z.infer<typeof formSchema>;

interface PiaFormProps {
  currentItem?: PIA | null;
  piaType: PiaType | null;
  onSuccess?: () => void;
}

export function PiaForm({ currentItem, piaType, onSuccess }: PiaFormProps) {
  const [loading, setLoading] = React.useState(false);
  const { toast } = useToast();
  const { firestore } = useFirebase();
  const router = useRouter();


  const clientsQuery = useMemoFirebase(() => firestore ? collection(firestore, 'clients') : null, [firestore]);
  const { data: clients, isLoading: isLoadingClients } = useCollection<Client>(clientsQuery);
  const projectsQuery = useMemoFirebase(() => firestore ? collection(firestore, 'projects') : null, [firestore]);
  const { data: projects, isLoading: isLoadingProjects } = useCollection<Project>(projectsQuery);

  const form = useForm<PiaFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: currentItem ? {
      ...currentItem,
      type: currentItem.type || piaType,
    } : {
      type: piaType || 'Simplificado',
      status: 'Rascunho',
      requerente: { clientId: '', nome: '', cpfCnpj: '' },
      empreendimento: { projectId: '', nome: '' },
    },
  });

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

    try {
        if (currentItem) {
          const docRef = doc(firestore, 'pias', currentItem.id);
          await updateDoc(docRef, dataToSave);
          toast({
            title: 'PIA atualizado!',
            description: `O formulário foi salvo como ${status.toLowerCase()}.`,
          });
        } else {
          const collectionRef = collection(firestore, 'pias');
          await addDoc(collectionRef, dataToSave);
          toast({
            title: 'PIA criado!',
            description: `O formulário para ${values.empreendimento.nome} foi criado com sucesso.`,
          });
          form.reset();
        }
        onSuccess?.();
    } catch (error) {
        console.error("Error saving PIA:", error);
        const permissionError = new FirestorePermissionError({
            path: currentItem ? `pias/${currentItem.id}` : 'pias',
            operation: currentItem ? 'update' : 'create',
            requestResourceData: dataToSave,
        });
        errorEmitter.emit('permission-error', permissionError);
    } finally {
        setLoading(false);
    }
  }
  
  const formProps = {
    form,
    clients: clients || [],
    isLoadingClients,
    projects: projects || [],
    isLoadingProjects
  };

  const renderFormContent = () => {
    switch (piaType) {
        case 'Inventário Florestal':
            return <PiaFormInventario form={form} clients={clients || []} isLoadingClients={isLoadingClients} projects={projects || []} isLoadingProjects={isLoadingProjects} />;
        case 'Simplificado':
        case 'Corretivo':
        case 'Censo Florestal':
        default:
            return (
                <div className="flex items-center justify-center h-40 border-2 border-dashed rounded-lg">
                    <p className="text-muted-foreground">Formulário para "{piaType}" em construção.</p>
                </div>
            );
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={(e) => e.preventDefault()} className="h-full flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto pr-4 -mr-2">
            {renderFormContent()}
        </div>

        <DialogFooter>
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
