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
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Oficio, AppUser } from '@/lib/types';
import { useFirebase, errorEmitter, useCollection, useMemoFirebase } from '@/firebase';
import { FirestorePermissionError } from '@/firebase/errors';
import { collection, doc, addDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Label } from '@/components/ui/label';

const formSchema = z.object({
  recipient: z.string().min(3, 'O destinatário é obrigatório.'),
  subject: z.string().min(5, 'O assunto é obrigatório.'),
  body: z.string().min(20, 'O corpo do ofício deve ter pelo menos 20 caracteres.'),
  municipio: z.string().min(1, 'O município é obrigatório.'),
  estado: z.string().min(2, 'O estado é obrigatório.').max(2, 'Use a sigla do estado.'),
  assinanteId: z.string().min(1, 'Selecione um assinante.'),
});

type FormValues = z.infer<typeof formSchema>;

interface OficioFormProps {
  currentItem?: Oficio | null;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function OficioForm({ currentItem, onSuccess, onCancel }: OficioFormProps) {
  const [loading, setLoading] = React.useState(false);
  const [assinaturaUrl, setAssinaturaUrl] = React.useState<string | null>(currentItem?.assinaturaDigitalUrl || null);
  
  const { toast } = useToast();
  const { firestore, user } = useFirebase();

  const usersQuery = useMemoFirebase(() => (firestore ? collection(firestore, 'users') : null), [firestore]);
  const { data: users, isLoading: isLoadingUsers } = useCollection<AppUser>(usersQuery);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      recipient: currentItem?.recipient || '',
      subject: currentItem?.subject || '',
      body: currentItem?.body || '',
      municipio: currentItem?.municipio || 'Unaí',
      estado: currentItem?.estado || 'MG',
      assinanteId: currentItem?.assinanteId || '',
    },
  });

  React.useEffect(() => {
    if (currentItem) {
      form.reset({
        recipient: currentItem.recipient,
        subject: currentItem.subject,
        body: currentItem.body,
        municipio: currentItem.municipio,
        estado: currentItem.estado,
        assinanteId: currentItem.assinanteId,
      });
      setAssinaturaUrl(currentItem.assinaturaDigitalUrl || null);
    }
  }, [currentItem, form]);

  const selectedAssinanteId = form.watch('assinanteId');
  
  const getRoleText = (role?: AppUser['role']) => {
    if (!role) return '';
    const roles = {
      admin: 'Administrador',
      client: 'Cliente',
      technical: 'Técnico',
      sales: 'Vendas',
      financial: 'Financeiro',
      gestor: 'Gestor Ambiental',
      supervisor: 'Supervisor',
      diretor_fauna: 'Diretor de Fauna',
    };
    return roles[role] || role;
  };
  
  const assinanteSelecionado = React.useMemo(() => {
    return users?.find(u => u.uid === selectedAssinanteId);
  }, [users, selectedAssinanteId]);
  
  async function handleSave(values: FormValues) {
    setLoading(true);
    if (!firestore || !user || !assinanteSelecionado) {
      toast({ variant: 'destructive', title: 'Erro de autenticação ou dados.', description: 'Não foi possível salvar o ofício.' });
      setLoading(false);
      return;
    }
    
    const dataToSave = {
      ...values,
      assinaturaDigitalUrl: assinaturaUrl || '',
      dataEmissao: new Date().toISOString(),
      assinanteNome: assinanteSelecionado.name,
      assinanteCargo: getRoleText(assinanteSelecionado.role),
      status: 'Rascunho' as const,
      createdBy: user.uid,
      creatorName: user.displayName || user.email,
    };

    try {
        if (currentItem) {
          const docRef = doc(firestore, 'oficios', currentItem.id);
          await updateDoc(docRef, dataToSave);
          toast({ title: 'Rascunho atualizado!' });
        } else {
          const collectionRef = collection(firestore, 'oficios');
          await addDoc(collectionRef, { ...dataToSave, createdAt: serverTimestamp() });
          toast({ title: 'Rascunho salvo!' });
        }
        onSuccess?.();
    } catch (error) {
        console.error("Error saving draft: ", error);
        const permissionError = new FirestorePermissionError({
            path: 'oficios',
            operation: currentItem ? 'update' : 'create',
            requestResourceData: dataToSave,
        });
        errorEmitter.emit('permission-error', permissionError);
    } finally {
        setLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSave)} className="h-full flex flex-col">
        <div className="flex-1 overflow-y-auto pr-1 space-y-4">
          <FormField
            control={form.control}
            name="recipient"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Destinatário</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: Gerente do Banco do Brasil, Agência Centro" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
           <FormField
            control={form.control}
            name="subject"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Assunto</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: Solicitação de Documentos" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="body"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Corpo do Ofício</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Insira o texto completo do seu ofício aqui..."
                    className="min-h-[250px]"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="p-4 border rounded-md my-4 space-y-4">
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                     <FormField
                        control={form.control}
                        name="municipio"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Município</FormLabel>
                            <FormControl>
                                <Input className="w-48" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                         <FormField
                        control={form.control}
                        name="estado"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Estado</FormLabel>
                            <FormControl>
                                <Input className="w-20" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                </div>
                 <p className="text-sm text-muted-foreground">{format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</p>
             </div>
          </div>
           <div className="p-4 border rounded-md my-4 space-y-4">
                <h3 className="text-base font-medium">Assinatura</h3>
                 <FormField
                    control={form.control}
                    name="assinanteId"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Assinante</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoadingUsers}>
                            <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder={isLoadingUsers ? "Carregando..." : "Selecione quem irá assinar"} />
                            </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                            {users?.map(u => (
                                <SelectItem key={u.uid} value={u.uid}>{u.name}</SelectItem>
                            ))}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                {assinanteSelecionado && (
                    <div className="text-center py-4">
                        <p className="font-semibold">{assinanteSelecionado.name}</p>
                        <p className="text-sm text-muted-foreground">{getRoleText(assinanteSelecionado.role)}</p>
                    </div>
                )}
           </div>

        </div>
        <div className="flex justify-end space-x-2 pt-4 border-t">
          <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
          <Button type="submit" disabled={loading}>
            {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando...</> : 'Salvar como Rascunho'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
