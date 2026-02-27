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
import { MaskedInput } from '@/components/ui/masked-input';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { TechnicalResponsible } from '@/lib/types';
import { useFirebase, errorEmitter } from '@/firebase';
import { FirestorePermissionError } from '@/firebase/errors';
import { collection, doc, addDoc, updateDoc } from 'firebase/firestore';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

const formSchema = z.object({
  name: z.string().min(2, 'O nome é obrigatório.'),
  cpf: z.string().min(11, 'O CPF é obrigatório.'),
  identidade: z.string().optional(),
  emissor: z.string().optional(),
  nacionalidade: z.string().optional(),
  estadoCivil: z.string().optional(),
  profession: z.string().min(2, 'A formação é obrigatória.'),
  registrationNumber: z.string().min(1, 'O número de registro é obrigatório.'),
  art: z.string().optional(),
  address: z.string().optional(),
  numero: z.string().optional(),
  bairro: z.string().optional(),
  municipio: z.string().optional(),
  uf: z.string().optional(),
  cep: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface ResponsibleFormProps {
  currentItem?: TechnicalResponsible | null;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function ResponsibleForm({ currentItem, onSuccess, onCancel }: ResponsibleFormProps) {
  const [loading, setLoading] = React.useState(false);
  const { toast } = useToast();
  const { firestore } = useFirebase();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: currentItem?.name || '',
      cpf: currentItem?.cpf || '',
      identidade: currentItem?.identidade || '',
      emissor: currentItem?.emissor || '',
      nacionalidade: currentItem?.nacionalidade || 'Brasileira',
      estadoCivil: currentItem?.estadoCivil || '',
      profession: currentItem?.profession || '',
      registrationNumber: currentItem?.registrationNumber || '',
      art: currentItem?.art || '',
      address: currentItem?.address || '',
      numero: currentItem?.numero || '',
      bairro: currentItem?.bairro || '',
      municipio: currentItem?.municipio || '',
      uf: currentItem?.uf || '',
      cep: currentItem?.cep || '',
    },
  });

  async function onSubmit(values: FormValues) {
    setLoading(true);

    if (!firestore) {
      toast({ variant: 'destructive', title: 'Firebase não inicializado.' });
      setLoading(false);
      return;
    }

    if (currentItem) {
      const docRef = doc(firestore, 'technicalResponsibles', currentItem.id);
      updateDoc(docRef, values)
        .then(() => {
          toast({ title: 'Responsável atualizado!', description: 'Os dados foram salvos com sucesso.' });
          onSuccess?.();
        })
        .catch(async (serverError) => {
          const permissionError = new FirestorePermissionError({
            path: docRef.path,
            operation: 'update',
            requestResourceData: values,
          });
          errorEmitter.emit('permission-error', permissionError);
        })
        .finally(() => setLoading(false));
    } else {
      const collectionRef = collection(firestore, 'technicalResponsibles');
      addDoc(collectionRef, values)
        .then(() => {
          toast({ title: 'Responsável criado!', description: `O profissional ${values.name} foi adicionado com sucesso.` });
          form.reset();
          onSuccess?.();
        })
        .catch(async (serverError) => {
          const permissionError = new FirestorePermissionError({
            path: collectionRef.path,
            operation: 'create',
            requestResourceData: values,
          });
          errorEmitter.emit('permission-error', permissionError);
        })
        .finally(() => setLoading(false));
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>{currentItem ? 'Editar Responsável' : 'Adicionar Novo Responsável'}</DialogTitle>
        <DialogDescription>
          {currentItem ? 'Atualize os detalhes do profissional.' : 'Preencha os detalhes do novo profissional.'}
        </DialogDescription>
      </DialogHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="h-full flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto pr-4 py-4 space-y-4">
          <FormField control={form.control} name="name" render={({ field }) => (<FormItem><FormLabel>Nome Completo</FormLabel><FormControl><Input placeholder="Nome do profissional" {...field} /></FormControl><FormMessage /></FormItem>)} />
          <FormField control={form.control} name="cpf" render={({ field }) => (<FormItem><FormLabel>CPF</FormLabel><FormControl><MaskedInput mask="cpf" placeholder="000.000.000-00" {...field} /></FormControl><FormMessage /></FormItem>)} />
          <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="identidade" render={({ field }) => (<FormItem><FormLabel>RG</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="emissor" render={({ field }) => (<FormItem><FormLabel>Órgão Emissor</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="nacionalidade" render={({ field }) => (<FormItem><FormLabel>Nacionalidade</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="estadoCivil" render={({ field }) => (
                  <FormItem><FormLabel>Estado Civil</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger></FormControl>
                      <SelectContent>
                          <SelectItem value="Solteiro(a)">Solteiro(a)</SelectItem>
                          <SelectItem value="Casado(a)">Casado(a)</SelectItem>
                          <SelectItem value="Divorciado(a)">Divorciado(a)</SelectItem>
                          <SelectItem value="Viúvo(a)">Viúvo(a)</SelectItem>
                          <SelectItem value="União Estável">União Estável</SelectItem>
                      </SelectContent>
                  </Select><FormMessage /></FormItem>
              )}/>
          </div>
           <div className="p-4 border rounded-md space-y-4">
              <h3 className="font-semibold text-base">Endereço</h3>
              <FormField control={form.control} name="address" render={({ field }) => (<FormItem><FormLabel>Logradouro</FormLabel><FormControl><Input placeholder="Rua, Av, etc." {...field} /></FormControl><FormMessage /></FormItem>)} />
              <div className="grid grid-cols-3 gap-4">
                   <FormField control={form.control} name="numero" render={({ field }) => (<FormItem><FormLabel>Nº</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                   <FormField control={form.control} name="bairro" render={({ field }) => (<FormItem className="col-span-2"><FormLabel>Bairro</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
              </div>
               <div className="grid grid-cols-3 gap-4">
                   <FormField control={form.control} name="municipio" render={({ field }) => (<FormItem className="col-span-2"><FormLabel>Município</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                   <FormField control={form.control} name="uf" render={({ field }) => (<FormItem><FormLabel>UF</FormLabel><FormControl><Input maxLength={2} {...field} /></FormControl><FormMessage /></FormItem>)} />
               </div>
               <FormField control={form.control} name="cep" render={({ field }) => (<FormItem><FormLabel>CEP</FormLabel><FormControl><Input placeholder="00000-000" {...field} /></FormControl><FormMessage /></FormItem>)} />
          </div>
          <FormField control={form.control} name="profession" render={({ field }) => (<FormItem><FormLabel>Formação / Profissão</FormLabel><FormControl><Input placeholder="Engenheiro Florestal" {...field} /></FormControl><FormMessage /></FormItem>)} />
          <FormField control={form.control} name="registrationNumber" render={({ field }) => (<FormItem><FormLabel>Nº de Registro no Conselho de Classe</FormLabel><FormControl><Input placeholder="CREA/CAU/etc." {...field} /></FormControl><FormMessage /></FormItem>)} />
          <FormField control={form.control} name="art" render={({ field }) => (<FormItem><FormLabel>Nº ART (Opcional)</FormLabel><FormControl><Input placeholder="Número da ART" {...field} /></FormControl><FormMessage /></FormItem>)} />
          </div>
          <div className="flex justify-end space-x-2 pt-4 mt-auto border-t">
              <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
                  Cancelar
              </Button>
            <Button type="submit" disabled={loading}>
              {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando...</> : 'Salvar'}
            </Button>
          </div>
        </form>
      </Form>
    </>
  );
}
